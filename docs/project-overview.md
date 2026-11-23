# 1. Project Overview & Linguistic Foundation

## 1.1 Executive Summary
**EthioSign (ኢትዮ-ሳይን)** is an open-source, AI-powered communication platform designed to overcome the severe communication barriers between the Deaf community in Ethiopia and the hearing majority. 

In Ethiopia, an estimated 1 to 2 million individuals are deaf or hard-of-hearing. A vast majority of hearing citizens, public service workers, educators, and medical professionals do not know Ethiopian Sign Language (EthSL). Professional sign language interpreters are scarce and cost-prohibitive for routine daily activities. EthioSign provides a direct, accessible, two-way bridge enabling fluid interaction without requiring both parties to share a common sign language.

---

## 1.2 The Two-Way Communication Paradigm

Communication is fundamentally bilateral. Existing assistive technologies frequently fail because they focus on one direction only. EthioSign implements a synchronized two-way architecture:

```
+-------------------------------------------------------------------------+
|                         ETHIOSIGN PLATFORM                              |
|                                                                         |
|  +--------------------+                     +------------------------+  |
|  |     DEAF USER      |                     |      HEARING USER      |  |
|  +---------+----------+                     +-----------+------------+  |
|            |                                            |               |
|            | 1. Performs EthSL sign                     | 1. Speaks or  |
|            |    in front of webcam                      |    types msg  |
|            v                                            v               |
|  [ Direction A Pipeline ]                   [ Direction B Pipeline ]    |
|  - Frame & Landmark Capture                 - Web Speech Audio Input    |
|  - Spatio-temporal AI Model                 - Natural Language Parser   |
|  - Amharic / English Gloss                  - EthSL Lexicon Matcher     |
|            |                                            |               |
|            | 2. Displays text &                         | 2. Displays   |
|            |    speaks translation                      |    sign video |
|            v                                            v               |
|  +--------------------+                     +------------------------+  |
|  | HEARS / READS MSG  |                     | WATCHES SIGN DEMO      |  |
|  +--------------------+                     +------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 1.3 Linguistic Authenticity: EthSL is NOT ASL

> [!CRITICAL]
> **EthSL Linguistic Identity**
> Ethiopian Sign Language (EthSL) is an autonomous language with its own phonology, morphosyntax, and vocabulary. It is culturally and linguistically distinct from American Sign Language (ASL), British Sign Language (BSL), or French Sign Language (LSF).

### Key Linguistic Differences:
1. **Phonological Primitives**: EthSL signs use specific hand configurations, palm orientations, points of contact, and movement trajectories that do not correspond to ASL glosses.
2. **Culturally Bound Vocabulary**: Core daily life signs—such as `እንጀራ` (*Injera*), `ዳቦ` (*Dabo*), `ማር` (*Mar*), `የኢትዮጵያ ባንዲራ` (*Ethiopian Flag*)—have no equivalent in Western sign systems.
3. **Kinship & Social Structure**: Kinship signs in EthSL feature unique compounds (e.g., gender facial markers combined with lineage touches for `እናቴ` [Mother] and `አባቴ` [Father]).
4. **Spatial Syntax & Non-Manual Markers**: EthSL utilizes facial expressions (eyebrow furrows, mouthings, head tilts) as required grammatical morphemes for questions (`የት` [Where?], `ማን` [Who?]), negations, and aspectual markers.

### EthioSign Policy:
* ASL datasets (e.g., WLASL, ASL Citizen) must **never** be presented to users as Ethiopian Sign Language.
* When evaluating or training machine learning backbones, only verified EthSL datasets (such as the Continuous Ethiopian Sign Language CESLR corpus and Ethiopian National Association of the Deaf [ENAD] documentation) are employed.

---

## 1.4 Target Personas & Use Cases

### Persona 1: Almaz (Deaf University Student)
* **Goal**: Communicate with academic advisors, registrar clerks, and hearing classmates.
* **Pain Point**: Sign language interpreters are rarely present during office hours; typing back and forth on a phone is slow and exhausting.
* **EthioSign Solution**: Almaz opens EthioSign on her laptop or tablet. She signs naturally into the webcam. EthioSign reads out her questions in clear Amharic speech to the advisor, and translates the advisor's spoken reply into sequenced EthSL sign video clips.

### Persona 2: Dr. Dawit (General Practitioner at a Public Clinic)
* **Goal**: Triage and diagnose Deaf patients accurately during emergency visits.
* **Pain Point**: Miscommunication in healthcare settings can be dangerous; written notes frequently fail when patients have varying Amharic written literacy.
* **EthioSign Solution**: Dr. Dawit uses the medical domain within EthioSign. The patient performs symptom signs (`ሆስፒታሉ`, `ሀኪም`, `ንጽህ`), which translate instantly into clinical text. Dr. Dawit speaks his instructions, displaying verified visual demonstrations for medication and follow-ups.

### Persona 3: Bethlehem (Hearing Sister of a Deaf Child)
* **Goal**: Learn sign language and converse informally at home with her brother.
* **Pain Point**: Generic online tutorials only teach American or British sign language.
* **EthioSign Solution**: Bethlehem browses the EthSL Dictionary, uses the 0.5x slow-motion video player to study exact finger positions, and practices signing in front of the camera with real-time recognition feedback.
