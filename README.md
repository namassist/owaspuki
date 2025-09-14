# OWASP Dashboard

Aplikasi dashboard untuk mengelola vulnerability assessment dan penetration testing dengan standar OWASP.

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (versi 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versi 2.0+)
- [Git](https://git-scm.com/downloads)

### 📋 Installation

#### 1. Clone Repository

```bash
git clone https://github.com/[username]/owasp-dashboard.git
cd owasp-dashboard
```

#### 2. Setup Environment (Optional)

```bash
# Copy environment template
cp env.example .env

# Edit .env file dengan konfigurasi Anda (opsional)
# Jika tidak ada .env, aplikasi akan menggunakan default values
```

#### 3. Build & Run

```bash
# Build dan jalankan semua services
docker-compose up --build -d
```

#### 4. Akses Aplikasi

Buka browser dan kunjungi: **http://localhost:3000**

## 🛠️ Configuration

### Environment Variables

File `.env` (opsional - ada default values):

```bash
# Database Configuration
POSTGRES_DB=owasp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Application Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/owasp?schema=public
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Custom ports
WEB_PORT=3000
DB_PORT=5432
```

### Default Values

Jika tidak ada file `.env`, aplikasi akan menggunakan:

- Database: `owasp` (user: `postgres`, password: `postgres`)
- Web App: `http://localhost:3000`
- Database Port: `5432`

## 📊 Features

- **Project Management**: Kelola proyek vulnerability assessment
- **Vulnerability Tracking**: Input dan track vulnerability sesuai OWASP Top 10
- **Evidence Management**: Upload dan kelola bukti (screenshot, dokumen)
- **Report Generation**: Export laporan dalam format PDF
- **User Management**: Sistem autentikasi dan role-based access
- **CVSS Calculator**: Kalkulator CVSS score terintegrasi

## 🔧 Useful Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs web
docker-compose logs db

# Stop all containers
docker-compose down

# Restart containers
docker-compose restart

# Rebuild and start
docker-compose up --build -d

# Remove everything (including data)
docker-compose down -v
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Cek port yang digunakan
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Stop containers
docker-compose down

# Jalankan ulang
docker-compose up -d
```

### Database Connection Error

```bash
# Restart database
docker-compose restart db

# Cek database logs
docker-compose logs db
```

### Reset Everything

```bash
# Stop dan hapus semua data
docker-compose down -v

# Rebuild dari awal
docker-compose up --build -d
```

## 📁 Project Structure

```
owasp-dashboard/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── projects/       # Project management
│   │   └── profile/        # User profile
│   ├── components/         # React components
│   └── lib/               # Utilities & configs
├── prisma/                # Database schema & migrations
├── public/                # Static files
│   ├── evidence/          # Uploaded evidence files
│   └── project-docs/      # Project documents
├── docker-compose.yml     # Docker services config
├── Dockerfile            # Web app container config
├── env.example           # Environment variables template
└── package.json          # Dependencies
```

## 🔐 Default Login

Setelah aplikasi berjalan:

1. Register akun baru melalui halaman login
2. Mulai menggunakan aplikasi

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Hacking! 🔒**
