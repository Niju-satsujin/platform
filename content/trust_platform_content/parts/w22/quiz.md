---
id: w22-quiz
title: "Week 22 Quiz"
order: 8
type: quiz
duration_min: 20
---

# Week 22 Quiz

Answer each question. Refer back to the lesson if needed.

---

### Q1 – What is an asset

In the context of [threat modelling](https://owasp.org/www-community/Threat_Modeling), what is an [asset](https://en.wikipedia.org/wiki/Asset_(computer_security))?

- A) Any line of code in the project
- B) Anything of value that the system holds or protects — data, services, [credentials](https://en.wikipedia.org/wiki/Credential), and keys — that an [attacker](https://en.wikipedia.org/wiki/Threat_actor) would want to access, modify, or destroy
- C) Only the database tables
- D) The hardware the system runs on

---

### Q2 – STRIDE categories

The [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) framework defines six [threat](https://owasp.org/www-community/Threat_Modeling) categories. Which list is correct?

- A) Scanning, Testing, Reviewing, Inspecting, Debugging, Evaluating
- B) [Spoofing](https://en.wikipedia.org/wiki/STRIDE_(security)), [Tampering](https://en.wikipedia.org/wiki/STRIDE_(security)), [Repudiation](https://en.wikipedia.org/wiki/STRIDE_(security)), [Information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security)), [Denial of service](https://en.wikipedia.org/wiki/STRIDE_(security)), [Elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security))
- C) Spoofing, Tracking, Replication, Interception, Disruption, Exploitation
- D) Secrets, Tokens, Resources, Identities, Data, Endpoints

---

### Q3 – Least privilege

The [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) says that every [actor](01-assets-actors.md) [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) have only the minimum permissions needed to do its job. In the [asset–actor map (L01)](lessons/01-assets-actors.md), what privilege level does the [attacker](https://en.wikipedia.org/wiki/Threat_actor) actor start with?

- A) 3 (admin) — so you can test admin attacks
- B) 1 (read) — so the attacker can at least see data
- C) 0 (none) — an attacker starts with zero privileges; any access gained is through [elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security))
- D) 2 (write) — attackers need write access to be dangerous

---

### Q4 – Mitigation coverage

The [mitigation planner (L03)](lessons/03-mitigations.md) computes [coverage](https://en.wikipedia.org/wiki/Code_coverage) as the percentage of [threats](lessons/02-threats.md) that have at least one `"verified"` mitigation. If there are 8 threats and 3 have verified mitigations, what is the coverage?

- A) 100% — because all threats have at least one mitigation registered
- B) 37% — because 3 out of 8 threats have verified defences
- C) 62% — because 5 out of 8 mitigations are still proposed
- D) 0% — because not all mitigations are verified

---

### Q5 – Secure by default

The [secure defaults engine (L04)](lessons/04-secure-defaults.md) sets `debug_mode` to `"off"` by default. A developer changes it to `"on"` in production. What [CWE](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html) weakness does this introduce?

- A) [CWE-120 Buffer overflow](https://cwe.mitre.org/data/definitions/120.html)
- B) [CWE-489 Active debug code](https://cwe.mitre.org/data/definitions/489.html) — debug mode in production exposes internal state, stack traces, and configuration to users
- C) [CWE-862 Missing authorization](https://cwe.mitre.org/data/definitions/862.html)
- D) No weakness — debug mode is harmless in production

---

### Q6 – Key rotation purpose

Why does the [key management registry (L05)](lessons/05-key-management.md) enforce [key rotation](https://en.wikipedia.org/wiki/Key_management#Key_rotation)?

- A) Because old keys take up too much disk space
- B) Because regular [rotation](https://en.wikipedia.org/wiki/Key_management#Key_rotation) limits the blast radius of a [key compromise](https://en.wikipedia.org/wiki/Key_(cryptography)) — even if an attacker obtains a key, it only works until the next rotation
- C) Because [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) requires rotation every 30 days
- D) Because keys degrade in quality over time like physical keys

---

### Q7 – Abuse case vs use case

What is the difference between a [use case](https://en.wikipedia.org/wiki/Use_case) and an [abuse case](https://en.wikipedia.org/wiki/Abuse_case)?

- A) There is no difference — they are the same thing with different names
- B) A [use case](https://en.wikipedia.org/wiki/Use_case) describes how a feature [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) work for a legitimate user. An [abuse case](https://en.wikipedia.org/wiki/Abuse_case) describes how an [attacker](https://en.wikipedia.org/wiki/Threat_actor) tries to break that feature — and the test passes only if the [mitigation](lessons/03-mitigations.md) blocks the attack
- C) A [use case](https://en.wikipedia.org/wiki/Use_case) is written in code; an [abuse case](https://en.wikipedia.org/wiki/Abuse_case) is written in English
- D) [Abuse cases](https://en.wikipedia.org/wiki/Abuse_case) only apply to web applications

---

### Q8 – CWE-120 connection

The [threat registry (L02)](lessons/02-threats.md) includes a threat referencing [CWE-120 buffer overflow](https://cwe.mitre.org/data/definitions/120.html) from [W01](../w01/part.md). Which [STRIDE](https://en.wikipedia.org/wiki/STRIDE_(security)) category does a [buffer overflow](https://cwe.mitre.org/data/definitions/120.html) most directly fall under?

- A) [Spoofing](https://en.wikipedia.org/wiki/STRIDE_(security)) — because the attacker pretends to be the buffer
- B) [Information disclosure](https://en.wikipedia.org/wiki/STRIDE_(security)) — because a [buffer overflow](https://cwe.mitre.org/data/definitions/120.html) can read adjacent memory, leaking [signing keys](lessons/05-key-management.md) or [credentials](https://en.wikipedia.org/wiki/Credential). It can also enable [Tampering](https://en.wikipedia.org/wiki/STRIDE_(security)) and [Elevation of privilege](https://en.wikipedia.org/wiki/STRIDE_(security)) depending on the exploit
- C) [Denial of service](https://en.wikipedia.org/wiki/STRIDE_(security)) only
- D) [Repudiation](https://en.wikipedia.org/wiki/STRIDE_(security)) — because the attacker can deny causing the overflow

---

### Q9 – Short answer: Why inventory first

Explain in two sentences why the [asset and actor inventory (L01)](lessons/01-assets-actors.md) [MUST](https://datatracker.ietf.org/doc/html/rfc2119) be completed before the [STRIDE threat enumeration (L02)](lessons/02-threats.md).

---

### Q10 – Short answer: Proposed vs verified

A team finishes [L03](lessons/03-mitigations.md) with 8 mitigations — all set to `"proposed"`. They claim the [threat model](https://owasp.org/www-community/Threat_Modeling) is complete. In two sentences, explain why this claim is wrong and what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) happen next.

---

### Q11 – Short answer: Zero-deviation audit

The [secure defaults engine (L04)](lessons/04-secure-defaults.md) audit shows zero deviations in the test environment but 3 deviations in the production environment. Explain why this gap is dangerous and what [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be done.

---

### Q12 – Short answer: Key never rotated

The [key audit (L05)](lessons/05-key-management.md) shows that `"platform_signing_key"` was created 400 days ago with a 90-day rotation schedule. Explain the risk and the required action.

---

### Q13 – Read the output

A developer runs the [mitigation coverage (L03)](lessons/03-mitigations.md) check and sees:

```
[mitigation] token_signature_check → threat 0 (token_spoofing) [verified]
[mitigation] bounds_check → threat 3 (key_leak) [verified]
[mitigation] audit_log → threat 2 (action_repudiation) [implemented]
[mitigation] rate_limiter → threat 4 (api_dos) [proposed]
Coverage: 25% (2/8 threats have verified mitigations)
```

The developer says: "We have 4 mitigations listed — that [SHOULD](https://datatracker.ietf.org/doc/html/rfc2119) be 50% coverage." Explain why the coverage is 25% and not 50%.

---

### Q14 – Read the output

A developer runs the [abuse-case suite (L06)](lessons/06-abuse-cases.md) and sees:

```
[case 0] test_token_spoofing: actor=3(attacker) asset=0(user_tokens) threat=0 mit=0 → PASS
[case 1] test_key_leak: actor=3(attacker) asset=2(signing_keys) threat=3 mit=1 → PASS
[case 2] test_priv_escalation: actor=0(user) asset=0(user_tokens) threat=5 mit=4 → FAIL
Report: 2 passed, 1 failed out of 3 (66% pass rate)
```

The `test_priv_escalation` case failed even though mitigation 4 (`"rbac_check"`) exists. What is the most likely reason the abuse case failed, and what [MUST](https://datatracker.ietf.org/doc/html/rfc2119) the developer check?
