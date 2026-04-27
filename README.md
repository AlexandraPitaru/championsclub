# ChampionsClub

README-ul de mai jos este facut ca sa nu existe confuzii dupa clone. Exista doua variante clare de lucru:

- dezvoltare locala: recomandata cand lucrati pe cod si testati cu Postman sau Bruno
- rulare completa cu Docker: recomandata cand vreti sa porniti rapid tot proiectul

## Structura proiectului

- `frontend` - aplicatie React + Vite
- `backend` - API FastAPI
- `postgres` - baza de date
- `docker-compose.yml` - porneste serviciile cu Docker

## Cerinte

### Pentru dezvoltare locala

- Git
- Docker Desktop
- Node.js 22+
- npm
- Python 3.12

### Pentru rulare completa cu Docker

- Git
- Docker Desktop

## Pasul 1. Clone repository-ul

```bash
cd "project_folder_name"
git clone <URL_REPOSITORY>
```

## Pasul 2. Configureaza `.env`

In radacina proiectului exista fisierul `.env.example`.

Creeaza fisierul `.env`:

```bash
cp .env.example .env
```

Pe Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Valorile implicite sunt:

```env
FRONTEND_PORT=5173
VITE_API_URL=http://backend:8000
APP_ENV=development
AUTO_SEED=true
BACKEND_PORT=8000
POSTGRES_DB=championsclub
POSTGRES_USER=championsclub
POSTGRES_PASSWORD=championsclub_dev_password
POSTGRES_PORT=5432
```

Modifica `.env` doar daca:

- unul dintre porturile `5173`, `8000`, `5432` este deja ocupat
- vrei alte credentiale pentru Postgres
- rulezi frontend local si backend local, caz in care `VITE_API_URL` trebuie sa fie `http://localhost:8000`
- vrei sa opresti seed-ul automat la pornirea prin Docker, caz in care `AUTO_SEED=false`

## Varianta A. Dezvoltare locala

Aceasta este varianta recomandata daca lucrati pe cod si testati endpoint-urile din Postman sau Bruno.

Ordinea corecta este:

1. pornesti baza de date
2. pornesti backend-ul local
3. testezi API-ul in browser, Postman sau Bruno
4. pornesti frontend-ul local

### A1. Porneste baza de date

Din radacina proiectului:

```bash
docker compose up -d postgres
```

Postgres va fi disponibil pe `localhost:5432`.

### A2. Porneste backend-ul local

Intra in folderul `backend` si ruleaza:

```bash
python -m venv .venv
```

Activeaza mediul virtual:

```powershell
.venv\Scripts\Activate.ps1
```

Instaleaza dependintele:

```bash
pip install -r requirements.txt
```

Asigura-te ca backend-ul foloseste baza locala:

```env
DATABASE_URL=postgresql://championsclub:championsclub_dev_password@localhost:5432/championsclub
```

Porneste API-ul:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend-ul va fi disponibil pe `http://localhost:8000`.

### A3. Testeaza API-ul

Inainte sa pornesti frontend-ul, poti verifica API-ul direct:

- browser: `http://localhost:8000/health`
- Postman: baza URL `http://localhost:8000`
- Bruno: baza URL `http://localhost:8000`

Raspunsul asteptat pentru healthcheck este:

```json
{
  "status": "ok",
  "environment": "development",
  "database_configured": "true"
}
```

### A4. Porneste frontend-ul local

Intra in folderul `frontend` si ruleaza:

```bash
npm install
npm run dev
```

Pentru frontend local, `VITE_API_URL` trebuie sa fie:

```env
VITE_API_URL=http://localhost:8000
```

Frontend-ul va fi disponibil pe `http://localhost:5173`.

## Varianta B. Rulare completa cu Docker

Aceasta varianta este buna daca vreti sa porniti rapid tot proiectul fara setup local separat pentru backend si frontend.

Ordinea corecta este:

1. configurezi `.env`
2. pornesti tot stack-ul cu Docker
3. verifici frontend-ul si backend-ul

### B1. Porneste toate serviciile

Din radacina proiectului ruleaza:

```bash
docker compose up --build
```

Se vor porni:

- frontend-ul pe `http://localhost:5173`
- backend-ul pe `http://localhost:8000`
- postgres pe `localhost:5432`

La prima pornire cu Docker, daca baza este goala si `AUTO_SEED=true`, backend-ul va popula automat baza cu date demo. Daca baza are deja date, seed-ul nu mai ruleaza.

Pentru varianta Docker, `VITE_API_URL` ramane:

```env
VITE_API_URL=http://backend:8000
```

### B2. Verificare

Testeaza:

- frontend: `http://localhost:5173`
- backend healthcheck: `http://localhost:8000/health`
- Postman sau Bruno: baza URL `http://localhost:8000`

## Oprire servicii

Pentru oprire:

```bash
docker compose down
```

Pentru oprire si stergere volum baza de date:

```bash
docker compose down -v
```

## Probleme frecvente

### Port deja ocupat

Schimba in `.env` una dintre valorile:

- `FRONTEND_PORT`
- `BACKEND_PORT`
- `POSTGRES_PORT`

Apoi reporneste serviciile.

### Frontend-ul nu poate apela backend-ul

- daca rulezi totul in Docker, foloseste `VITE_API_URL=http://backend:8000`
- daca rulezi frontend local, foloseste `VITE_API_URL=http://localhost:8000`

### Postman sau Bruno nu raspund

- verifica daca backend-ul ruleaza pe `http://localhost:8000`
- verifica endpoint-ul `http://localhost:8000/health`
- daca backend-ul este in Docker, verifica daca serviciul `backend` este pornit si portul `8000` este expus

### Backend-ul nu porneste

- verifica daca Postgres este pornit
- verifica valoarea `DATABASE_URL`
- daca folosesti dezvoltare locala, porneste mai intai `postgres`, apoi backend-ul

## Comenzi utile

```bash
docker compose up --build
docker compose up -d postgres
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```
