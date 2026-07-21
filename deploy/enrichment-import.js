/**
 * PRISM enrichment import (browser-only, FERPA).
 * Merges Infinite Campus student.export files + ALP/BIP PDF text into caseload students.
 * Never upload/commit real student files — localStorage only.
 */
(function (global) {
  "use strict";

  const SPELL = [
    ["barrallaga", "barralaga"],
    ["esperza", "esparza"],
    ["wagnor", "wagoner"],
    ["crosey", "crossley"],
    ["zachary", "zachery"],
    ["lilian", "lillian"],
    ["juwell", "juwell"],
    ["briamah", "braimah"],
  ];

  function normSpace(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function collapse(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function applySpell(s) {
    let out = collapse(s);
    SPELL.forEach(([a, b]) => {
      out = out.split(a).join(b);
    });
    return out;
  }

  function nameKeyFromLastFirst(raw) {
    let s = String(raw || "").replace(/\([^)]*\)/g, "").trim();
    s = s.replace(/[–—]/g, "-");
    if (!s) return "";
    if (s.includes(",")) {
      const [last, rest] = s.split(",", 2);
      const first = (rest || "").trim().split(/\s+/)[0] || "";
      return applySpell(last) + "|" + applySpell(first);
    }
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return applySpell(parts[parts.length - 1]) + "|" + applySpell(parts[0]);
    }
    return applySpell(s);
  }

  /** First Middle Last Last2 → try compound last names */
  function nameKeysFromLegal(raw) {
    const s = normSpace(String(raw || "").replace(/\([^)]*\)/g, ""));
    const keys = new Set();
    if (!s) return [];
    if (s.includes(",")) {
      keys.add(nameKeyFromLastFirst(s));
      const [last, rest] = s.split(",", 2);
      const first = (rest || "").trim().split(/\s+/)[0] || "";
      // JuWell / Ju Well
      keys.add(applySpell(last) + "|" + applySpell(first.replace(/([a-z])([A-Z])/g, "$1$2")));
      keys.add(applySpell(last) + "|" + applySpell(first).slice(0, 2));
      return [...keys].filter(Boolean);
    }
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      keys.add(applySpell(parts[parts.length - 1]) + "|" + applySpell(parts[0]));
    }
    if (parts.length >= 3) {
      keys.add(applySpell(parts[parts.length - 2] + parts[parts.length - 1]) + "|" + applySpell(parts[0]));
      keys.add(applySpell(parts[parts.length - 1]) + "|" + applySpell(parts[0]));
    }
    if (parts.length >= 4) {
      keys.add(applySpell(parts.slice(-2).join("")) + "|" + applySpell(parts[0]));
    }
    return [...keys].filter(Boolean);
  }

  function parseTsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((l) => l.trim());
    if (!lines.length) return { headers: [], rows: [] };
    const headers = lines[0].split("\t").map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split("\t");
      while (cols.length < headers.length) cols.push("");
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (cols[idx] || "").trim();
      });
      rows.push(obj);
    }
    return { headers, rows };
  }

  function detectExportKind(headers) {
    const h = headers.map((x) => x.toLowerCase());
    if (h.includes("student name") && h.some((x) => x.includes("parent") || x.includes("household"))) {
      return "contacts";
    }
    if (h.includes("student") && h.some((x) => x.includes("street") || x === "zip")) {
      return "address";
    }
    return "unknown";
  }

  function contactsFromExport(rows) {
    return rows.map((r) => {
      const name = r["Student Name"] || r["Student"] || "";
      return {
        keys: nameKeysFromLegal(name),
        rawName: name,
        studentNumber: r["Student Number"] || "",
        gradeLevel: r["Grade Level"] || "",
        enrollStatus: r["Enroll Status"] || "",
        parent1Name: r["Household 1 Parent 1 Name"] || "",
        parent1Email: r["Household 1 Parent 1 Email"] || "",
        parent1Phone: r["Household 1 Parent 1 Phone"] || "",
        parent2Name: r["Household 1 Parent 2 Name"] || "",
        parent2Email: r["Household 1 Parent 2 Email"] || "",
        parent2Phone: r["Household 1 Parent 2 Phone"] || "",
        hh2Parent1Name: r["Household 2 Parent 1 Name"] || "",
        hh2Parent1Email: r["Household 2 Parent 1 Email"] || "",
        hh2Parent2Name: r["Household 2 Parent 2 Name"] || "",
        hh2Parent2Email: r["Household 2 Parent 2 Email"] || "",
      };
    });
  }

  function addressFromExport(rows) {
    return rows.map((r) => {
      const name = r["Student"] || r["Student Name"] || "";
      return {
        keys: nameKeysFromLegal(name),
        rawName: name,
        guardian1: r["Guardian 1 Name"] || "",
        street: r["Street"] || "",
        city: r["City"] || "",
        state: r["State"] || "",
        zip: r["Zip"] || "",
      };
    });
  }

  function excerptBetween(text, startRe, endRe, maxLen) {
    const m = text.match(startRe);
    if (!m) return "";
    const start = m.index + m[0].length;
    let end = text.length;
    if (endRe) {
      const n = text.slice(start).search(endRe);
      if (n >= 0) end = start + n;
    }
    return normSpace(text.slice(start, end)).slice(0, maxLen || 900);
  }

  function parseAlpPackets(text) {
    const packets = [];
    // Flatten soft line breaks before DOB so "Leon Dominguez\nGonzalez 12/25/..." parses
    const flat = String(text || "").replace(/([A-Za-z])\s*\n\s*([A-Za-z])/g, "$1 $2");
    const re = /(^|\n)([A-Z][^\n\d]{2,80}?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2})\s+(\d{5,})/g;
    let m;
    const hits = [];
    while ((m = re.exec(flat))) {
      const name = normSpace(m[2]);
      if (/Cherry Creek|Talent Pool|Legal Name|Page |Street|Greenwood/i.test(name)) continue;
      if (name.split(/\s+/).length < 2) continue;
      hits.push({ name, index: m.index, dob: m[3], grade: m[4], lasid: m[5] });
    }
    text = flat;
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      const chunk = text.slice(h.index, hits[i + 1] ? hits[i + 1].index : h.index + 3500);
      if (packets.some((p) => p.name === h.name)) continue;
      packets.push({
        name: h.name,
        keys: nameKeysFromLegal(h.name),
        dob: h.dob,
        grade: h.grade,
        lasid: h.lasid,
        type: "ALP",
        strengths: excerptBetween(chunk, /Area of Strength|Potential Strength/i, /Goals|Achievement/i, 700),
        goals: excerptBetween(chunk, /\nGoals\n|Measurable Goal/i, /Instructional Actions|Achievement/i, 700),
        profile: excerptBetween(chunk, /Student Profile/i, /Student Interests|Area of Strength/i, 500),
      });
    }
    return packets;
  }

  function parseBipPackets(text) {
    const flat = String(text || "").replace(/([A-Za-z])\s*\n\s*([A-Za-z])/g, "$1 $2");
    const parts = flat.split(/Behavioral Intervention Plan \(BIP\)/i);
    const packets = [];
    const seen = new Set();
    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i].slice(0, 12000);
      const m = chunk.match(
        /([A-Z][^\n\d]{2,80}?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{5,})/
      );
      if (!m) continue;
      const name = normSpace(m[1]);
      if (/Cherry Creek|Legal Name|Page /i.test(name)) continue;
      const keyId = name.toLowerCase();
      if (seen.has(keyId)) continue;
      seen.add(keyId);
      packets.push({
        name,
        keys: nameKeysFromLegal(name),
        dob: m[2],
        lasid: m[3],
        type: "BIP",
        strengths: excerptBetween(
          chunk,
          /STRENGTH BASED PROFILE/i,
          /FUNCTIONAL BEHAVIOR ASSESSMENT/i,
          900
        ),
        fba: excerptBetween(
          chunk,
          /FUNCTIONAL BEHAVIOR ASSESSMENT \(FBA\) SUMMARY STATEMENT/i,
          /PREVENTION STRATEGIES|REPLACEMENT BEHAVIOR|TEACHING STRATEGIES/i,
          900
        ),
      });
    }
    return packets;
  }

  function indexByKeys(items) {
    const map = new Map();
    items.forEach((item) => {
      (item.keys || []).forEach((k) => {
        if (!k) return;
        if (!map.has(k)) map.set(k, item);
      });
    });
    return map;
  }

  function findMatch(student, map) {
    const keys = nameKeysFromLegal(student.rawName || student.name);
    for (const k of keys) {
      if (map.has(k)) return map.get(k);
    }
    // prefix first-name soft match within same last
    for (const k of keys) {
      const [last, first] = k.split("|");
      if (!last || !first || first.length < 2) continue;
      for (const [mk, item] of map.entries()) {
        const [ml, mf] = mk.split("|");
        if (ml === last && mf && (mf.startsWith(first.slice(0, 3)) || first.startsWith(mf.slice(0, 3)))) {
          return item;
        }
        if (
          ml.slice(0, 6) === last.slice(0, 6) &&
          Math.abs(ml.length - last.length) <= 2 &&
          mf &&
          first &&
          mf.slice(0, 3) === first.slice(0, 3)
        ) {
          return item;
        }
      }
    }
    return null;
  }

  function mergeEnrichmentIntoStudents(students, packs) {
    const contactMap = indexByKeys(packs.contacts || []);
    const addressMap = indexByKeys(packs.addresses || []);
    const alpMap = indexByKeys(packs.alps || []);
    const bipMap = indexByKeys(packs.bips || []);

    const report = {
      contactsMatched: [],
      contactsMissing: [],
      addressMatched: [],
      addressMissing: [],
      alpMatched: [],
      alpUnmatchedPackets: [],
      bipMatched: [],
      bipUnmatchedPackets: [],
      spellingNotes: [],
    };

    const next = students.map((s) => {
      const copy = { ...s };
      const c = findMatch(s, contactMap);
      const a = findMatch(s, addressMap);
      const alp = findMatch(s, alpMap);
      const bip = findMatch(s, bipMap);

      if (c) {
        report.contactsMatched.push(s.name);
        copy.studentNumber = c.studentNumber || copy.studentNumber || "";
        copy.contacts = {
          parent1Name: c.parent1Name,
          parent1Email: c.parent1Email,
          parent1Phone: c.parent1Phone,
          parent2Name: c.parent2Name,
          parent2Email: c.parent2Email,
          parent2Phone: c.parent2Phone,
          hh2Parent1Name: c.hh2Parent1Name,
          hh2Parent1Email: c.hh2Parent1Email,
          hh2Parent2Name: c.hh2Parent2Name,
          hh2Parent2Email: c.hh2Parent2Email,
          matchedAs: c.rawName,
        };
        if (c.rawName && c.rawName !== (s.rawName || s.name)) {
          report.spellingNotes.push(s.name + " ↔ " + c.rawName);
        }
      } else if ((packs.contacts || []).length) {
        report.contactsMissing.push(s.name);
      }

      if (a) {
        report.addressMatched.push(s.name);
        copy.address = {
          guardian1: a.guardian1,
          street: a.street,
          city: a.city,
          state: a.state,
          zip: a.zip,
          matchedAs: a.rawName,
        };
      } else if ((packs.addresses || []).length) {
        report.addressMissing.push(s.name);
      }

      if (alp) {
        report.alpMatched.push(s.name);
        copy.hasAlp = true;
        copy.alp = {
          strengths: alp.strengths,
          goals: alp.goals,
          profile: alp.profile,
          matchedAs: alp.name,
        };
        if (alp.goals && (!copy.goals || !copy.goals.length || copy.goals[0].startsWith("Goals not"))) {
          copy.goals = [alp.goals.slice(0, 240)];
        }
        if (!copy.disability || copy.disability === "2e" || copy.disability === "SPED") {
          /* keep program label */
        }
      }

      if (bip) {
        report.bipMatched.push(s.name);
        copy.hasBip = true;
        if (!copy.discipline.includes("Behavior")) copy.discipline = copy.discipline.concat(["Behavior"]);
        copy.bip = {
          strengths: bip.strengths,
          fba: bip.fba,
          matchedAs: bip.name,
        };
        if (bip.strengths) {
          const interestBit = bip.strengths.match(/enjoys[^.]+|interests?[^.]+/i);
          if (interestBit && (!copy.interests || copy.interests === "—")) {
            copy.interests = interestBit[0].slice(0, 180);
          }
        }
      }

      copy.docs = {
        contacts: !!c,
        address: !!a,
        alp: !!alp,
        bip: !!bip,
        iep: !!(copy.docs && copy.docs.iep),
        eval: !!(copy.docs && copy.docs.eval),
        progress: !!(copy.docs && copy.docs.progress),
      };
      return copy;
    });

    (packs.alps || []).forEach((p) => {
      if (!report.alpMatched.some((n) => nameKeysFromLegal(n).some((k) => (p.keys || []).includes(k)))) {
        // check if any student matched this packet
        const hit = next.some((s) => s.alp && s.alp.matchedAs === p.name);
        if (!hit) report.alpUnmatchedPackets.push(p.name);
      }
    });
    (packs.bips || []).forEach((p) => {
      const hit = next.some((s) => s.bip && s.bip.matchedAs === p.name);
      if (!hit) report.bipUnmatchedPackets.push(p.name);
    });

    return { students: next, report };
  }

  async function extractPdfText(file) {
    if (!global.pdfjsLib) {
      throw new Error("PDF.js not loaded — cannot read PDF in browser");
    }
    const buf = await file.arrayBuffer();
    const pdf = await global.pdfjsLib.getDocument({ data: buf }).promise;
    const chunks = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const line = content.items.map((it) => it.str).join(" ");
      chunks.push(line);
    }
    return chunks.join("\n");
  }

  async function ingestFiles(fileList) {
    const packs = { contacts: [], addresses: [], alps: [], bips: [], files: [] };
    const files = [...fileList];
    for (const file of files) {
      const name = file.name || "file";
      const lower = name.toLowerCase();
      packs.files.push(name);
      if (lower.endsWith(".pdf")) {
        const text = await extractPdfText(file);
        if (/Behavioral Intervention Plan \(BIP\)/i.test(text) || /STRENGTH BASED PROFILE/i.test(text)) {
          packs.bips = packs.bips.concat(parseBipPackets(text));
        }
        if (/Talent Pool/i.test(text) || /Area of Strength/i.test(text)) {
          packs.alps = packs.alps.concat(parseAlpPackets(text));
        }
        // if neither matched strongly, try both parsers
        if (!packs.bips.length && !packs.alps.length) {
          packs.bips = packs.bips.concat(parseBipPackets(text));
          packs.alps = packs.alps.concat(parseAlpPackets(text));
        }
      } else {
        const text = await file.text();
        // ARR CSV special pops?
        if (lower.endsWith(".csv") && /Case Manager/i.test(text) && /IEP Date/i.test(text)) {
          packs.arrCsvText = text;
          continue;
        }
        const { headers, rows } = parseTsv(text);
        const kind = detectExportKind(headers);
        if (kind === "contacts") packs.contacts = packs.contacts.concat(contactsFromExport(rows));
        else if (kind === "address") packs.addresses = packs.addresses.concat(addressFromExport(rows));
        else {
          // try contacts if Student Name present
          if (headers.some((h) => /student name/i.test(h))) {
            packs.contacts = packs.contacts.concat(contactsFromExport(rows));
          } else if (headers.some((h) => /^student$/i.test(h))) {
            packs.addresses = packs.addresses.concat(addressFromExport(rows));
          } else {
            throw new Error("Unrecognized file: " + name);
          }
        }
      }
    }
    // de-dupe packets by name
    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter((x) => {
        const k = (x.name || x.rawName || "").toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };
    packs.alps = dedupe(packs.alps);
    packs.bips = dedupe(packs.bips);
    return packs;
  }

  global.PrismEnrichment = {
    nameKeysFromLegal,
    parseTsv,
    detectExportKind,
    parseAlpPackets,
    parseBipPackets,
    mergeEnrichmentIntoStudents,
    extractPdfText,
    ingestFiles,
  };
})(typeof window !== "undefined" ? window : globalThis);
