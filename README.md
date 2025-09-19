# Eido

Eido is an open-source platform for **Diagram-as-Code**.  
It allows developers and architects to **describe systems in simple, declarative code** and automatically generate clear, always-up-to-date architecture diagrams.

### Why Eido?
- 🖥 **Code Visualized** – Turn DSL statements into reusable diagrams instantly.  
- ⚡ **Modern Stack** – Built with **Next.js + React** (frontend) and **Django Ninja** (backend).  
- 🗄 **Reliable Storage** – Powered by **PostgreSQL** for robust relational data.  
- 🔗 **Docs in Sync** – Keep your documentation and system design aligned at all times.  

### Use Cases
- Keep architecture diagrams consistent with codebase changes.  
- Generate system diagrams for onboarding, reviews, or audits.  
- Simplify collaboration between developers, architects, and stakeholders.  

👉 Check out the [Docs](https://github.com/fish-not-phish/eido/blob/main/frontend/app/docs/page.mdx) for guides, examples, and advanced usage.  

```markdown
![Diagram](https://github.com/fish-not-phish/eido/blob/main/eido-file.png?raw=true)
```

---

# Example Use Case

Write out your diagram as code:
```
Compute [icon: aws-ec2]

VPC [icon: aws-vpc] {
  Server [icon: aws-ec2]
  Data [icon: aws-rds]
}

compute > Server

Server > Data
```

Save it and see your code be transformed into a diagram! See the result below.

```markdown
![Diagram](https://github.com/fish-not-phish/eido/blob/main/diagram.png?raw=true)
```

# Eido Development Environment

This project provides a full-stack development setup for **Eido**, consisting of:

- **Backend**: Django REST API
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL

The stack is containerized using **Docker** and orchestrated with **docker-compose**, making it easy to spin up a local development environment with a single command.  

---

# Setup Script & Environment Variables
 
Instead, you configure all environment variables directly in **docker-compose.yml**.

---

## 1. Build the Docker images

From the project root, run:

```bash
# Build the Django backend
docker build -f Dockerfile.backend -t eido-backend .

# Build the Next.js frontend
docker build -f Dockerfile.frontend -t eido-frontend .

# Pull Postgres image
docker pull postgres:latest
```

---

## 2. Configure environment variables

Create a `SECRET_KEY`:

```
openssl rand -hex 64
```

Open `docker-compose.yml` and update the following values:
- Backend
    - `SECRET_KEY` → Use the previous created value.
    - `DJANGO_ALLOWED_HOSTS` → domains your app will serve (e.g. `localhost 127.0.0.1 eido.example.com`)
    - `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` → match the Postgres config
    - `CORS_ALLOWED_ORIGINS` → origins allowed to access the API (e.g. `http://localhost:3000 https://eido.example.com`)
- Database
    - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` → must match backend’s DB settings
- Frontend
    - `NEXT_PUBLIC_API_BASE_URL` → URL for the API (e.g. `http://localhost:8000/api` for local dev, `https://eido.example.com/api` for prod)

---

## 3. Start the stack

Run:
```
docker compose up -d
```

This will start:
- Postgres
- Backend (Django)
- Frontend (Next.js)

Eido should now be running!