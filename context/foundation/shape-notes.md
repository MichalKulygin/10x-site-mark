---
project: 10x-site-mark
context_type: greenfield
updated: 2026-05-30
product_type: web-app
target_scale:
  users: small
timeline_budget:
  mvp_weeks: 4
  hard_deadline: null
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  frs_drafted: 5
  quality_check_status: accepted
---

## Vision & Problem Statement

Ból: dane i rysunki z pracy w terenie utknione lokalnie — nie trafiają do biura w czasie zbliżonym do rzeczywistego.

Pracownik grupy technicznej (przeglądy, pomiary, instalacje) po wykonaniu pracy przy zleceniu musi zaraportować postęp lub wykonanie. Dziś robi to manualnie: notatki, zdjęcia, szkice — bez możliwości przekazania rysunków CAD ani danych pomiarowych do back-office.

Koszt dziś: czas stracony na ręczną dokumentację + ryzyko utraty lub przekłamania danych przy przepisywaniu do systemu biurowego.

## User & Persona

**Główna persona:** Pracownik grupy technicznej

- Rola: wykonuje przeglądy / pomiary / instalacje w terenie przy konkretnym zleceniu
- Kontekst: ma dostęp do pliku DXF opisującego obiekt/rzut zlecenia
- Potrzeba: szybko nanieść rysunek/zapis na rzutnię i persystować go jako protokół wykonanej pracy
- Środowisko: przeglądarka (web), prawdopodobnie tablet lub laptop w terenie

## Access Control

- Auth: email + hasło (konto per użytkownik)
- Role MVP: tylko **Wykonawca** — tworzy rysunki na rzutniach i zapisuje je
- Back-office jako rola odroczona do v2 (zob. FR-005, rewizja z rundy Sokratesa)
- Model minimalny: jedna rola w MVP, brak granularnych uprawnień

## Success Criteria

### Primary
- Wykonawca dodaje rysunek na wybranej rzutni bez instrukcji w czasie < 5 minut od otwarcia aplikacji
- Lista zapisanych rysunków jest zgodna z tym co wykonawca dodał — zero utraty danych
- Pliki DXF wczytują się i renderują listę rzutni bez błędów
- Logowanie działa poprawnie

### Secondary
- Eksport gotowego rysunku do PDF lub obrazka (nice-to-have)

### Guardrails
- Zero utraty danych rysunków — zapisany rysunek jest zawsze wierną kopią tego co użytkownik narysował
- Import nowego pliku CAD nie nadpisuje ani nie kasuje wcześniej zapisanych rysunków
- Aplikacja umożliwia rysowanie przy braku lub słabym połączeniu internetowym (teren)

## Timeline acknowledgment

mvp_weeks: 4
Kontekst: parsowanie/renderowanie DWG/DXF w przeglądarce to główne ryzyko techniczne.

## Functional Requirements

### Importowanie i renderowanie CAD

- FR-001: Wykonawca może zaimportować plik DXF do aplikacji. Priority: must-have
  > Sokrates: Kontrargument rozważony: "DWG to format binarny/proprietary — DXF-only wystarczyłoby na MVP." Rezolucja: **zrewidowany** — import ograniczony do DXF w MVP; DWG odroczone do v2.

- FR-002: Wykonawca może przeglądać listę rzutni (viewport/layout) z importowanego pliku DXF. Priority: must-have
  > Sokrates: Kontrargument rozważony: "Lista rzutni może być technicznie trudna do uzyskania z DXF bez pełnego parsera." Rezolucja: FR pozostaje — parsowanie layoutów z DXF jest wymagane; ryzyko techniczne odnotowane i zarządzane przez dobór biblioteki.

### Rysowanie

- FR-003: Wykonawca może tworzyć rysunek na wybranej rzutni za pomocą prostych narzędzi (linia, punkt, tekst). Priority: must-have
  > Sokrates: Kontrargument rozważony: "Rysowanie na canvas CAD jest trudniejsze niż na pustym płótnie — może zwielokrotnić czas do MVP." Rezolucja: FR pozostaje; toolset zawężony do minimum (linia, punkt, tekst) aby ograniczyć zakres.

- FR-004: Wykonawca może zapisywać i odczytywać swoje rysunki (z lokalnym cache dla trybu offline). Priority: must-have
  > Sokrates: Kontrargument rozważony: "Odczyt w terenie bez internetu wymaga lokalnego cache — to dodatkowa złożoność." Rezolucja: FR pozostaje; offline jest guardrailem z Fazy 3 — złożoność jest świadomie akceptowana.

### Konta i dostęp

- FR-005: Wykonawca może się zarejestrować i zalogować (email + hasło). Priority: must-have
  > Sokrates: Kontrargument rozważony: "Dwie role to za dużo na MVP — zacznij od jednej roli (wykonawca), back-office dodać w v2." Rezolucja: **zrewidowany** — MVP zawiera tylko rolę wykonawcy; back-office odroczone do v2.

- FR-007: System zawiera jedno zahardkodowane zlecenie (bez modułu zarządzania zleceniami). Priority: must-have
  > Sokrates: Brak kontrargumentu — FR pozostaje bez zmian.

### Post-MVP (poza zakresem MVP)

- FR-006: Użytkownik roli back-office może przeglądać listę rysunków od wykonawców. Priority: post-MVP
  > Sokrates: Przeniesiony — rola back-office odroczona do v2 (zob. rewizja FR-005).

- FR-008: Użytkownik może eksportować rysunek do PDF lub obrazka. Priority: nice-to-have / post-MVP
  > Sokrates: Kontrargument rozważony: "Eksport PDF z canvas CAD może wydłużyć MVP o 1–2 tygodnie." Rezolucja: **zdegradowany** do post-MVP.

## User Stories

### US-01: Wykonawca tworzy i zapisuje rysunek na rzutni

**Given:** Wykonawca jest zalogowany i ma dostępny plik DXF opisujący obiekt zlecenia.
**When:** Importuje plik do aplikacji, wybiera rzutnię z listy, tworzy rysunek za pomocą prostych narzędzi (linia, punkt, tekst) i zapisuje go.
**Then:** Rysunek pojawia się na liście wykonanych rysunków i jest dostępny do ponownego odczytu.

## Business Logic

Aplikacja wiąże zapis pracy z konkretną pozycją przestrzenną na rzutni DXF, tworząc zlokalizowany protokół wykonania widoczny w kontekście planu technicznego.

Wejście reguły (co dostarcza wykonawca):
- Rysunek (linie, punkty, tekst) zakotwiczony na współrzędnych rzutni DXF
- Opis tekstowy / notatka do zapisu
- Data i czas wykonania pracy (rejestrowane automatycznie lub manualnie)
- Tożsamość wykonawcy (z konta zalogowanego użytkownika)

Wyjście: zapis pracy przypisany do rzutni, zlecenia i wykonawcy — persystowany i dostępny do odczytu.

Plik DXF jest wyłącznie podkładem (read-only): aplikacja nigdy go nie modyfikuje ani nie zapisuje z powrotem. Rysunki wykonawcy są bytem odrębnym od pliku DXF — przechowywane oddzielnie, niezależnie od cyklu życia pliku źródłowego.

## Non-Functional Requirements

- NFR-01: Aplikacja umożliwia tworzenie i zapis rysunków przy braku lub słabym połączeniu internetowym (synchronizacja następuje po odzyskaniu połączenia). Cel: działanie w terenie bez gwarancji zasięgu.
- NFR-02: UI działa poprawnie na urządzeniach dotykowych (tablet, telefon) — gesty rysowania responsywne na ekranie dotykowym.
- NFR-03: Wykonawca ma dostęp wyłącznie do własnych zapisów — izolacja danych między kontami jest bezwzględna.

## Non-Goals

- Zarządzanie zleceniami (CRUD zleceń) — MVP ma jedno zahardkodowane zlecenie; moduł zleceń to v2+.
- Rola back-office w MVP — widok i funkcje back-office odroczone do v2 (decyzja z rundy Sokratesa FR-005).
- Obsługa formatu DWG — MVP obsługuje wyłącznie DXF; DWG post-MVP (decyzja z rundy Sokratesa FR-001).
- Aplikacja mobilna / natywna — tylko web; brak natywnej aplikacji iOS/Android w MVP.
- Kreator nowych typów obsługiwanych prac/zapisów — własne obiekty z formularzami to zakres daleko poza MVP.
- Modyfikacja pliku DXF — aplikacja nie zapisuje żadnych zmian do pliku DXF; plik źródłowy jest nienaruszalny.

## Quality cross-check

Cross-check przeprowadzony 2026-05-30. Wszystkie elementy obecne po korekcie niespójności:
- Access Control: zaktualizowane (jedna rola MVP)
- Business Logic: jednozdaniowa reguła ✓
- Timeline-cost: 4 tygodnie, blok acknowledgment ✓
- Non-Goals: 5 wpisów ✓
Status: accepted

## Open Questions

- OQ-001: Dlaczego problem nie został dotąd rozwiązany przez dostępne narzędzia? (insight niezdefiniowany przez użytkownika — wymaga zbadania przed PRD)
