# InteKRator - Web Interface Documentation

Dieses Dokument beschreibt den aktuellen Stand der Features und Funktionalitäten des InteKRator Web-Frontends.

## Übersicht
Das InteKRator Web Interface bietet eine benutzerfreundliche Oberfläche zur Verwaltung von Datensätzen und zur Visualisierung von Inferenz-Ergebnissen, basierend auf der InteKRator Core-Logik.

## Implementierte Features

### 1. Datensatz-Management (`/datasets`)
Hier können Trainingsdaten verwaltet werden.
*   **Datensatz-Übersicht**: Liste aller verfügbaren Datensätze auf der linken Seite.
*   **Upload**: Möglichkeit, neue Datensätze via CSV-Datei oder Drag-and-Drop hochzuladen.
*   **Versionierung**: Jeder Datensatz kann mehrere Versionen haben. Neue Versionen können aus bestehenden erstellt werden.
*   **Manueller Editor**:
    *   Bearbeiten von Datensatz-Werten direkt im Browser.
    *   Hinzufügen neuer Zeilen.
    *   Speichern als neue Version.

### 2. Trainings-Dashboard (`/training`)
*(Funktionalität im Backend integriert, Frontend bietet Schnittstelle)*
*   Auswahl eines Datensatzes und einer Version für das Training.
*   Anzeige des Trainingsstatus.

### 3. Ergebnis-Visualisierung (`/results`)
Das Herzstück der Analyse. Hier werden trainierte Modelle visualisiert und Entscheidungen erklärt.
*   **Interaktiver Graph**:
    *   Visualisierung von Outcomes (Ergebnissen), Regeln und Bedingungen als Knoten.
    *   Verbindungen zeigen den Fluss von Bedingungen zu Regeln zu Ergebnissen.
    *   **Pan & Zoom**: Die Arbeitsfläche kann verschoben und gezoomt werden.
*   **Inferenz-Analyse**:
    *   Eingabe von Zustandsparametern ("Zustandsparameter") für eine ausgewählte Version.
    *   Button **"Entscheidung analysieren"**: Führt eine Inferenz durch.
*   **Pfad-Highlighting**:
    *   **Hover-Effekt**: Beim Überfahren mit der Maus werden zusammengehörige Pfade (Bedingung -> Regel -> Outcome) blau hervorgehoben.
    *   **Inferenz-Highlighting**: Nach einer Analyse wird der getroffene Entscheidungspfad **orange/bernsteinfarben** dauerhaft hervorgehoben. Dies schließt den Pfad sowie den Outcome-Knoten und die beteiligten Regeln/Bedingungen ein.
*   **Reset**: Ein "Zurücksetzen"-Button leert die Eingaben und entfernt die Inferenz-Visualisierung.

## Ausblick & Weiterentwicklung

Folgende Punkte könnten in Zukunft umgesetzt werden, um die Anwendung zu erweitern:

*   **Erweiterte Regel-Informationen**: Anzeige von mehr Details (z.B. Abdeckung, Support) beim Klick auf eine Regel.
*   **Vergleichs-Modus**: Visueller Vergleich verschiedener Modell-Versionen nebeneinander.
*   **Export**: Exportieren der visualisierten Graphen als Bild (PNG/SVG) oder PDF Bericht.
*   **Benutzerverwaltung**: Rollenbasierter Zugriff auf verschiedene Datensätze und Kollaboration.
*   **Verkettung**: Verkettung von Datensätzen und Abfragen über mehrere Wissensbasen hinweg


## Anmerkungen
*   Bei der Wissensabfrage muss 1 zu 1 so getippt werden, wie die Parameter im Datensatz. (Bsp: No Recovery im Tree -> "no_recovery")
*   Bisher sind alle anderen Trainingsparameter noch nicht implementiert.
---
*Stand: Januar 2026*
