---
project: 10x-site-mark
version: 1
status: draft
created: 2026-05-30
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 4
  hard_deadline: null
  after_hours_only: true
---

## Vision & Problem Statement

Pracownik grupy technicznej (przeglądy, pomiary, instalacje) po wykonaniu pracy przy zleceniu musi zaraportować postęp lub wykonanie. Dane i rysunki z pracy w terenie utknione są lokalnie — nie trafiają do biura w czasie zbliżonym do rzeczywistego. Dziś proces wygląda tak: notatki, zdjęcia, szkice wykonane ręcznie, a następnie przepisane lub przetworzone w biurze — bez możliwości przekazania rysunków w kontekście planu technicznego. Koszt: czas stracony na ręczną dokumentację i ryzyko utraty lub przekłamania danych przy przepisywaniu do systemu biurowego.

# TODO: insight — dlaczego ten problem istnieje pomimo dostępnych narzędzi? — see Open Questions

## User & Persona

**Główna persona:** Pracownik grupy technicznej

- **Rola:** Wykonawca prac — wykonuje przeglądy, pomiary lub instalacje w terenie przy konkretnym zleceniu
- **Kontekst:** Ma dostęp do pliku DXF opisującego obiekt lub rzut zlecenia; pracuje w przeglądarce na tablecie lub laptopie w terenie
- **Moment:** Po wykonaniu pracy przy zleceniu musi szybko nanieść rysunek/zapis na rzutnię i persystować go jako protokół wykonanej pracy
- **Środowisko:** Przeglądarka (web), urządzenie dotykowe (tablet) lub laptop, często w warunkach słabego zasięgu

## Success Criteria

### Primary
- Wykonawca dodaje rysunek na wybranej rzutni bez instrukcji w czasie < 5 minut od otwarcia aplikacji
- Lista zapisanych rysunków jest zgodna z tym co wykonawca dodał — zero utraty danych
- Pliki DXF wczytują się i renderują listę rzutni bez błędów
- Logowanie działa poprawnie

### Secondary
- Eksport gotowego rysunku do PDF lub obrazka

### Guardrails
- Zapisany rysunek jest zawsze wierną kopią tego, co użytkownik narysował — zero rozbieżności
- Import nowego pliku DXF nie nadpisuje ani nie kasuje wcześniej zapisanych rysunków
- Aplikacja pozostaje użyteczna do tworzenia i zapisu rysunków przy braku połączenia z internetem

## User Stories

### US-01: Wykonawca tworzy i zapisuje rysunek na rzutni

- **Given** wykonawca jest zalogowany i ma dostępny plik DXF opisujący obiekt zlecenia
- **When** importuje plik do aplikacji, wybiera rzutnię z listy, tworzy rysunek za pomocą prostych narzędzi (linia, punkt, tekst) i zapisuje go
- **Then** rysunek pojawia się na liście wykonanych rysunków i jest dostępny do ponownego odczytu

#### Acceptance Criteria
- Czas od otwarcia aplikacji do zapisanego pierwszego rysunku wynosi < 5 minut bez instrukcji
- Zapisany rysunek odczytany ponownie jest identyczny z tym co zostało narysowane
- Pełny flow (import → wybór rzutni → rysunek → zapis → lista) kończy się bez błędów

## Functional Requirements

### Importowanie i renderowanie CAD

- FR-001: Wykonawca może zaimportować plik DXF do aplikacji. Priority: must-have
  > Sokrates: Kontrargument rozważony: "DWG to format binarny/proprietary — DXF-only wystarczyłoby na MVP." Rezolucja: **zrewidowany** — import ograniczony do DXF w MVP; DWG odroczone do v2.

- FR-002: Wykonawca może przeglądać listę rzutni (viewport/layout) z importowanego pliku DXF. Priority: must-have
  > Sokrates: Kontrargument rozważony: "Lista rzutni może być technicznie trudna do uzyskania z DXF bez pełnego parsera." Rezolucja: FR pozostaje — parsowanie layoutów z DXF jest wymagane; ryzyko techniczne odnotowane i zarządzane przez dobór biblioteki.

### Rysowanie

- FR-003: Wykonawca może tworzyć rysunek na wybranej rzutni za pomocą prostych narzędzi (linia, punkt, tekst). Priority: must-have
  > Sokrates: Kontrargument rozważony: "Rysowanie na canvas CAD jest trudniejsze niż na pustym płótnie — może zwielokrotnić czas do MVP." Rezolucja: FR pozostaje; toolset zawężony do minimum (linia, punkt, tekst) aby ograniczyć zakres.

- FR-004: Wykonawca może zapisywać i odczytywać swoje rysunki bez aktywnego połączenia z internetem. Priority: must-have
  > Sokrates: Kontrargument rozważony: "Tryb offline wymaga dodatkowego rozwiązania dla persystencji lokalnej — to świadomie akceptowana złożoność." Rezolucja: FR pozostaje; tryb offline jest guardrailem z fazy discovery.

### Konta i dostęp

- FR-005: Wykonawca może się zarejestrować i zalogować (email + hasło). Priority: must-have
  > Sokrates: Kontrargument rozważony: "Dwie role to za dużo na MVP — zacznij od jednej roli (wykonawca), back-office dodać w v2." Rezolucja: **zrewidowany** — MVP zawiera tylko rolę wykonawcy; back-office odroczone do v2.

- FR-007: System zawiera jedno zahardkodowane zlecenie (bez modułu zarządzania zleceniami). Priority: must-have
  > Sokrates: Brak kontrargumentu — FR pozostaje bez zmian.

## Non-Functional Requirements

- NFR-01: Aplikacja pozostaje w pełni użyteczna (tworzenie i zapis rysunków) przy braku lub słabym połączeniu z internetem; zapisy stają się widoczne w systemie po odzyskaniu łączności.
- NFR-02: Interfejs działa poprawnie na urządzeniach z ekranem dotykowym (tablet, telefon) — rysowanie i nawigacja nie wymagają myszy ani klawiatury.
- NFR-03: Wykonawca ma dostęp wyłącznie do własnych zapisów — dane różnych kont są od siebie izolowane.

## Business Logic

Aplikacja wiąże zapis pracy z konkretną pozycją przestrzenną na rzutni DXF, tworząc zlokalizowany protokół wykonania widoczny w kontekście planu technicznego.

Wejście, które dostarcza wykonawca:
- Rysunek (linie, punkty, tekst) zakotwiczony na wybranych współrzędnych rzutni
- Opis tekstowy / notatka opisująca wykonaną pracę
- Data i czas wykonania pracy (rejestrowane automatycznie lub podawane manualnie)
- Tożsamość wykonawcy (wynikająca z zalogowanego konta)

Wyjście: zapis pracy przypisany do konkretnej rzutni, zlecenia i wykonawcy — persystowany i dostępny do ponownego odczytu.

Plik DXF jest wyłącznie podkładem (read-only): aplikacja nigdy go nie modyfikuje, nie nadpisuje ani nie zapisuje z powrotem. Rysunki wykonawcy są bytem odrębnym od pliku DXF — przechowywane oddzielnie, niezależnie od cyklu życia pliku źródłowego.

## Access Control

Autentykacja: email i hasło, konto per użytkownik.

MVP: jedna rola — **Wykonawca**. Wykonawca może tworzyć, zapisywać i odczytywać własne rysunki. Nie ma dostępu do rysunków innych wykonawców.

Rola back-office (odbiorca i przeglądarka rysunków od wykonawców) odroczona do v2.

Niezautoryzowany użytkownik nie ma dostępu do żadnych danych aplikacji.

## Non-Goals

- **Zarządzanie zleceniami:** MVP zawiera jedno zahardkodowane zlecenie; CRUD zleceń to v2+.
- **Rola back-office w MVP:** Widok i funkcje back-office (przeglądanie rysunków innych wykonawców) odroczone do v2.
- **Obsługa formatu DWG:** MVP obsługuje wyłącznie DXF; DWG odroczone do v2.
- **Aplikacja mobilna / natywna:** Tylko web; brak natywnej aplikacji iOS/Android w MVP.
- **Kreator nowych typów prac/zapisów:** Własne obiekty z formularzami leżą poza zakresem MVP.
- **Modyfikacja pliku DXF:** Aplikacja nie zapisuje żadnych zmian do pliku DXF — plik źródłowy jest nienaruszalny.

## Open Questions

1. **Dlaczego ten problem istnieje pomimo dostępnych narzędzi?** — Insight niezdefiniowany podczas sesji shape. Właściciel: użytkownik. Blokuje: drugą część sekcji Vision & Problem Statement; nie blokuje implementacji MVP.
2. **Docelowe wartości qps i wolumenu danych?** — Przyjęto `qps: low`, `data_volume: small` jako ballpark dla pilotu z kilkoma użytkownikami; weryfikacja przy skalowaniu.
