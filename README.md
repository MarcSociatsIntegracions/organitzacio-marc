# Organitza't - Aplicació d'Organització Personal

Aquesta aplicació web està construïda amb Next.js, TypeScript, Tailwind CSS i Supabase. 

## Característiques
- **Autenticació robusta**: Email i contrasenya via Supabase Auth.
- **Gestió de Tasques**: Prioritats, dates límit, backlog i vincles amb objectius.
- **Calendari Avançat**: Suport per a blocs fixos (plantilles setmanals), excepcions (overrides) i tasques programades.
- **Objectius a llarg termini**: Seguiment de progrés basat en tasques completades.
- **Estadístiques**: Gràfics de hores planificades vs. reals i estat de tasques.
- **Timer**: Cronòmetre integrat per a tasques.
- **Disseny Premium**: UI moderna, responsive (PC i Mòbil) i amb suport PWA.

## Configuració del Projecte (Pas a Pas)

### 1. Clonar i Instal·lar Dependències
```bash
npm install
```

### 2. Configurar Supabase
1. Crea un projecte nou a [Supabase](https://supabase.com).
2. Ves a **SQL Editor** i executa el contingut de `supabase/schema.sql`.
   - Això crearà totes les taules, índexs, RLS i el trigger de perfils.
3. Activa les **Variables d'Entorn**:
   - Copia `.env.local.example` a `.env.local`.
   - Omple les claus `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` des de *Settings > API*.

### 3. Executar en Local
```bash
npm run dev
```
L'app estarà disponible a [http://localhost:3000](http://localhost:3000).

### 4. Deploy a Vercel
1. Puja el codi a un repositori de GitHub.
2. Connecta el repositori a [Vercel](https://vercel.com).
3. Afegeix les variables d'entorn al panell de Vercel.
4. Vercel detectarà automàticament que és un projecte Next.js i farà el desplegament.

## Estructura de Fitxers
- `/src/app/app`: Rutes protegides de l'aplicació.
- `/src/components/calendar`: Lògica visual del calendari.
- `/src/lib/calendar-logic.ts`: Lògica de negoci per calcular esdeveniments (templates + overrides).
- `/src/types/database.ts`: Tipus de TypeScript sincronitzats amb la BD.

## Timezone
L'aplicació està configurada per defecte per funcionar amb `Europe/Madrid`.

---
*Creat amb ❤️ per Antigravity per a Google Deepmind.*
