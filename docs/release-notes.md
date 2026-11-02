# Nytt i Hallen

Versionsnyheterna finns i `frontend/hallen-app/src/features/release-notes/releases.ts`.

Inför en release med nyheter:

1. Lägg den nya posten först i `releases`.
2. Ge posten ett unikt, permanent `id`, exempelvis `2026-11-09` eller `2026-11-09-2`.
3. Ange datum, rubrik, inledning och förändringar skrivna för appens användare.
4. Deploya frontend och eventuella backendändringar tillsammans som vanligt.

Den senaste posten öppnas automatiskt för inloggade användare tills de stänger
nyheterna. Stängknappen, Escape, bakgrundsklick och ”Nu kör vi!” markerar posten
som läst. Den går alltid att öppna igen med ”Nytt i Hallen” i huvudmenyn.

Lässtatus sparas per konto, release och webbläsare i localStorage. En annan
enhet/webbläsare eller rensad lokal lagring kan därför visa samma release igen.
Ingen databasändring krävs. Om webbläsaren blockerar localStorage används minne
under det pågående besöket. Andra öppna flikar uppdateras via storage-händelser.

En deploy utan ett nytt release-ID visar inte redan lästa nyheter igen. Ändra
inte ID på en publicerad post för små språkrättningar. Ge verkligt nya nyheter
en ny post och ett nytt ID. Äldre poster behålls i filen; dialogen visar den
senaste releasen, även om användaren har missat flera releaser.
