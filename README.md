# 🍽️ Receptlådan

En delad receptbok för familj/vänner. Spara recept ni snappar upp från mejl, bilder eller länkar — allt på ett ställe, med egna "receptlådor" per person.

Byggd som en enda fristående webbsida (`index.html`), värd gratis på GitHub Pages, med [Supabase](https://supabase.com) som databas.

---

## ✨ Funktioner

- **Flera receptlådor** – varje person väljer eller skapar sin egen låda första gången de öppnar appen. Ingen inloggning eller lösenord krävs.
- **Alla recept / Mina recept** – bläddra i allas recept, eller filtrera till bara din egen låda.
- **Kopiera recept** – gilla någon annans recept? Kopiera det till din egen låda med en knapptryckning. Man kan bara redigera/ta bort sina egna recept.
- **Spara vad som helst** – receptnamn, taggar, en länk, fri text/anteckning, och flera bilder per recept.
- **Hämta info automatiskt** – klistra in en länk och låt appen försöka hämta titel och bild automatiskt från sidan.
- **Zoombara bilder** – bra när receptet ligger inbakat i en bild (t.ex. ett foto av en kokbokssida).
- **Egna taggar** – lägg till, byt namn på eller ta bort taggar/kategorier (förrätt, huvudrätt, fisk, kött, osv.) via "Hantera taggar".
- **Betygsätt recept** – klicka på 1–5 stjärnor för att sätta ditt eget betyg. Varje person i receptlådan har sitt eget betyg, och kortet visar snittet av allas betyg.
- **Sök, filtrera och sortera** – sök på namn, filtrera på taggar, sortera på senast tillagda eller bokstavsordning.
- **Export** – exportera allt som en JSON-backup, eller som en snygg utskriftsvänlig PDF (med klickbara länkar), som respekterar aktiva filter.

---

## 🧱 Teknik

- Ren HTML/CSS/JavaScript – inget byggsteg, inga beroenden att installera
- [Supabase](https://supabase.com) (Postgres-databas) som backend, via `@supabase/supabase-js`
- [jsPDF](https://github.com/parallax/jsPDF) för PDF-export
- Hostas gratis via **GitHub Pages**
- Ett **GitHub Actions**-jobb håller Supabase-projektet vaket (gratisprojekt pausas annars efter 7 dagars inaktivitet)

---

## 🚀 Komma igång från grunden

Om ni någon gång behöver sätta upp allt på nytt (t.ex. nytt Supabase-projekt), kör detta i **Supabase SQL Editor**, i den här ordningen:

```sql
-- Användare / receptlådor
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
alter table users enable row level security;
create policy "allow all" on users for all using (true) with check (true);

-- Taggar
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
alter table tags enable row level security;
create policy "allow all" on tags for all using (true) with check (true);

insert into tags (name) values
  ('Förrätt'),('Huvudrätt'),('Efterrätt'),('Fisk'),('Kött'),('Vegetariskt'),('Bakning'),('Snabbmat')
on conflict (name) do nothing;

-- Recept
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text[] default '{}',
  link text,
  note text,
  images text[] default '{}',
  copied_from uuid references recipes(id) on delete set null,
  owner_id uuid references users(id),
  created_at timestamptz default now()
);
alter table recipes enable row level security;
create policy "allow all" on recipes for all using (true) with check (true);

-- Betyg
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (recipe_id, user_id)
);
alter table ratings enable row level security;
create policy "allow all" on ratings for all using (true) with check (true);

-- Skapa en första receptlåda
insert into users (name) values ('Irene') on conflict (name) do nothing;
```

Uppdatera sedan `SUPABASE_URL` och `SUPABASE_ANON_KEY` högst upp i `index.html` (hittas under **Project Settings → API** i Supabase) och ladda upp filen till repot.

### Aktivera GitHub Pages
**Settings → Pages** → Branch: `main`, mapp `/ (root)` → Save. Sidan blir tillgänglig på `https://dittanvändarnamn.github.io/reponamn/`.

### Hålla Supabase vaket
Filen `.github/workflows/keep-alive.yml` pingar databasen var tredje dag och committar en liten tidsstämpel, vilket håller både Supabase-projektet och det schemalagda jobbet självt vid liv på obestämd tid.

---

## 📖 Använda appen

1. **Första gången:** välj din receptlåda i listan, eller skapa en ny med ditt namn.
2. **Lägg till recept:** tryck "+ Nytt recept" – fyll i namn, taggar, och valfritt en länk, anteckning och/eller bilder.
3. **Bläddra:** växla mellan "Alla recept" och "Mina recept", sök, filtrera på taggar, eller sortera.
4. **Gilla någon annans recept?** Öppna det och tryck "Kopiera till min receptlåda".
5. **Säkerhetskopiera då och då:** tryck "Exportera recept" (JSON) eller "Exportera som PDF" och spara filen någonstans säkert.

---

## 💾 Om lagring och gränser

Databasen körs på Supabase gratisnivå: cirka 500 MB, vilket räcker till ungefär 1000–1500 recept med bilder (betydligt fler om ni mest sparar länkar/text). Ingen automatisk backup finns på gratisnivån — därför är exportfunktionen bra att använda regelbundet.

---

*Byggd tillsammans med Claude.*
