import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that enables running headers, footers, and two-pass page numbering."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 755, "SPENDWISE — NEW DEVICE MIGRATION & SETUP GUIDE")
            self.setFont("Helvetica", 8)
            self.drawRightString(572, 755, "CONFIDENTIAL & LOCAL ENVIRONMENT")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(40, 747, 572, 747)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(40, 42, 572, 42)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(40, 28, "SpendWise Fullstack Monorepo (NestJS + Next.js + Expo + MongoDB)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 28, page_text)
        self.restoreState()


def read_file_or_fallback(file_path, fallback_content):
    """Dynamically reads local .env from disk if available on current machine, avoiding hardcoded secrets in code."""
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    return content
        except Exception:
            pass
    return fallback_content.strip()


def create_migration_pdf(output_path, root_dir):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    primary_color = colors.HexColor("#4338CA")
    dark_text = colors.HexColor("#0F172A")
    muted_text = colors.HexColor("#475569")
    code_bg = colors.HexColor("#0F172A")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.white,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#E0E7FF")
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=dark_text,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_text,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#F8FAFC")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E293B")
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=dark_text
    )

    table_cell_mono = ParagraphStyle(
        'TableCellMono',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#4338CA")
    )

    story = []

    # -------------------------------------------------------------
    # 1. HEADER BANNER
    # -------------------------------------------------------------
    banner_content = [
        [
            Paragraph("<b>DEVICE MIGRATION & ENVIRONMENT SETUP GUIDE</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor("#C7D2FE"))),
        ],
        [
            Paragraph("SpendWise Fullstack Workspace Restoration", title_style)
        ],
        [
            Paragraph("Complete manual containing all <b>git-ignored environment variables (.env)</b>, system prerequisites, package dependencies, and step-by-step launch commands for your new machine.", subtitle_style)
        ]
    ]

    banner_table = Table(banner_content, colWidths=[532])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#312E81")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # Quick Metadata Strip
    meta_data = [
        [
            Paragraph("<b>Workspace Architecture:</b> Turborepo + pnpm", body_style),
            Paragraph("<b>Node.js:</b> >= 20.11.0 (v22 LTS rec)", body_style),
            Paragraph("<b>Package Manager:</b> pnpm 9.15.4", body_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[180, 172, 180])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 2. SYSTEM PREREQUISITES
    # -------------------------------------------------------------
    story.append(Paragraph("1. System Prerequisites & Global Tooling", h1_style))
    story.append(Paragraph("Before installing project packages on your new laptop, verify that the following runtime engines and package managers are installed and added to PATH:", body_style))

    prereq_data = [
        [
            Paragraph("Component", table_header_style),
            Paragraph("Target Version", table_header_style),
            Paragraph("Installation / Verification Command", table_header_style),
            Paragraph("Notes", table_header_style),
        ],
        [
            Paragraph("<b>Node.js</b>", table_cell_bold),
            Paragraph(">= 20.11.0<br/>(v22 LTS used)", table_cell_style),
            Paragraph("<code>winget install OpenJS.NodeJS.LTS</code><br/><code>node -v</code>", table_cell_mono),
            Paragraph("JavaScript runtime for API, Web & Tooling", table_cell_style),
        ],
        [
            Paragraph("<b>pnpm</b>", table_cell_bold),
            Paragraph("9.15.4", table_cell_style),
            Paragraph("<code>npm install -g pnpm@9.15.4</code><br/><code>pnpm -v</code>", table_cell_mono),
            Paragraph("Required monorepo workspace package manager", table_cell_style),
        ],
        [
            Paragraph("<b>Git</b>", table_cell_bold),
            Paragraph("Latest", table_cell_style),
            Paragraph("<code>git --version</code>", table_cell_mono),
            Paragraph("Source control and husky hook management", table_cell_style),
        ],
        [
            Paragraph("<b>Optional CLIs</b>", table_cell_bold),
            Paragraph("Latest", table_cell_style),
            Paragraph("<code>npm i -g turbo @nestjs/cli expo-cli</code>", table_cell_mono),
            Paragraph("Global helpers (can also use local pnpm binaries)", table_cell_style),
        ]
    ]

    prereq_table = Table(prereq_data, colWidths=[90, 85, 205, 152])
    prereq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(prereq_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 3. GIT-IGNORED FILES (.ENV)
    # -------------------------------------------------------------
    story.append(Paragraph("2. Git-Ignored Environment Files (.env)", h1_style))
    
    alert_box = [
        [
            Paragraph("<b>CRITICAL FOR NEW DEVICE:</b> Git ignores all <code>.env</code> files. On your new laptop, create each of the 4 files below with the exact directory paths, keys, and values displayed.", ParagraphStyle('Alert', parent=body_style, textColor=colors.HexColor("#92400E")))
        ]
    ]
    alert_table = Table(alert_box, colWidths=[532])
    alert_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(alert_table)
    story.append(Spacer(1, 8))

    # Read dynamically from disk or use fallback
    root_env_path = os.path.join(root_dir, ".env")
    root_fallback = "NODE_ENV=development\nPORT=4000\nAPI_PORT=4000\nWEB_PORT=3000\nMOBILE_API_URL=http://localhost:4000/api/v1\nAPI_BASE_URL=http://localhost:4000/api/v1\n\n# Google SMTP\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=465\nSMTP_SECURE=true\nSMTP_USER=your-email@gmail.com\nSMTP_PASS=your-app-password\nSMTP_FROM_EMAIL=your-email@gmail.com\nSMTP_FROM_NAME=SpendWise\nEMAIL_VERIFICATION_CODE_TTL_MINUTES=10\nEMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60"
    root_env_code = read_file_or_fallback(root_env_path, root_fallback)

    story.append(Paragraph("<b>File 2.1: Root Workspace Environment</b> — <code>SpendWise/.env</code>", h2_style))
    code_table1 = Table([[Paragraph(root_env_code.replace('\n', '<br/>'), code_style)]], colWidths=[532])
    code_table1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), code_bg),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(code_table1)
    story.append(Spacer(1, 8))

    # File 2: apps/api/.env
    api_env_path = os.path.join(root_dir, "apps", "api", ".env")
    api_fallback = "NODE_ENV=development\nPORT=4000\nMONGODB_URI=mongodb+srv://<user>:<password>@spendwise.c2i5amu.mongodb.net/\nJWT_ACCESS_SECRET=change-me-access-secret\nJWT_REFRESH_SECRET=change-me-refresh-secret\nJWT_ACCESS_TTL=15m\nJWT_REFRESH_TTL=7d\nAI_PROVIDER=gemini\nGOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key"
    api_env_code = read_file_or_fallback(api_env_path, api_fallback)

    story.append(Paragraph("<b>File 2.2: Backend API Environment</b> — <code>SpendWise/apps/api/.env</code>", h2_style))
    code_table2 = Table([[Paragraph(api_env_code.replace('\n', '<br/>'), code_style)]], colWidths=[532])
    code_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), code_bg),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(code_table2)

    story.append(PageBreak())

    # File 3: apps/web/.env
    web_env_path = os.path.join(root_dir, "apps", "web", ".env")
    web_fallback = "NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1\nNEXT_PUBLIC_APP_NAME=SpendWise\nAUTH_COOKIE_NAME=spendwise_access_token\nBETTER_AUTH_SECRET=replace-with-a-long-random-string\nBETTER_AUTH_URL=http://localhost:3000\nGOOGLE_GENERATIVE_AI_API_KEY="
    web_env_code = read_file_or_fallback(web_env_path, web_fallback)

    story.append(Paragraph("<b>File 2.3: Web Dashboard Environment</b> — <code>SpendWise/apps/web/.env</code>", h2_style))
    code_table3 = Table([[Paragraph(web_env_code.replace('\n', '<br/>'), code_style)]], colWidths=[532])
    code_table3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), code_bg),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(code_table3)
    story.append(Spacer(1, 8))

    # File 4: apps/mobile/.env
    mobile_env_path = os.path.join(root_dir, "apps", "mobile", ".env")
    mobile_fallback = "EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1\nEXPO_PUBLIC_APP_NAME=SpendWise"
    mobile_env_code = read_file_or_fallback(mobile_env_path, mobile_fallback)

    story.append(Paragraph("<b>File 2.4: Mobile App Environment</b> — <code>SpendWise/apps/mobile/.env</code>", h2_style))
    code_table4 = Table([[Paragraph(mobile_env_code.replace('\n', '<br/>'), code_style)]], colWidths=[532])
    code_table4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), code_bg),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(code_table4)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 4. STEP-BY-STEP DEV COMMANDS
    # -------------------------------------------------------------
    story.append(Paragraph("3. Step-by-Step Installation & Dev Commands", h1_style))
    story.append(Paragraph("Run the following terminal commands in order inside your cloned repository root on the new laptop:", body_style))

    commands_data = [
        [
            Paragraph("Step", table_header_style),
            Paragraph("Action", table_header_style),
            Paragraph("Command", table_header_style),
            Paragraph("Expected Result", table_header_style)
        ],
        [
            Paragraph("1", table_cell_bold),
            Paragraph("Install All Dependencies", table_cell_style),
            Paragraph("<code>pnpm install</code>", table_cell_mono),
            Paragraph("Resolves all workspace links and node_modules", table_cell_style)
        ],
        [
            Paragraph("2", table_cell_bold),
            Paragraph("Build Internal Packages", table_cell_style),
            Paragraph("<code>pnpm --filter @spendwise/shared build<br/>pnpm --filter @spendwise/ai build</code>", table_cell_mono),
            Paragraph("Emits TypeScript types and compiled dist bundles", table_cell_style)
        ],
        [
            Paragraph("3", table_cell_bold),
            Paragraph("Verify Monorepo Build", table_cell_style),
            Paragraph("<code>pnpm build</code>", table_cell_mono),
            Paragraph("Tests full compilation across API, Web & Mobile", table_cell_style)
        ],
        [
            Paragraph("4", table_cell_bold),
            Paragraph("Seed MongoDB Data (Optional)", table_cell_style),
            Paragraph("<code>pnpm --filter @spendwise/api seed</code>", table_cell_mono),
            Paragraph("Populates MongoDB Atlas with seed data & categories", table_cell_style)
        ],
        [
            Paragraph("5", table_cell_bold),
            Paragraph("Start All Services (Dev)", table_cell_style),
            Paragraph("<code>pnpm dev</code>", table_cell_mono),
            Paragraph("Turborepo launches API (4000), Web (3000), Mobile concurrently", table_cell_style)
        ],
        [
            Paragraph("6", table_cell_bold),
            Paragraph("Start API Only", table_cell_style),
            Paragraph("<code>pnpm --filter @spendwise/api dev</code>", table_cell_mono),
            Paragraph("NestJS API live at http://localhost:4000/api/v1", table_cell_style)
        ],
        [
            Paragraph("7", table_cell_bold),
            Paragraph("Start Web Only", table_cell_style),
            Paragraph("<code>pnpm --filter @spendwise/web dev</code>", table_cell_mono),
            Paragraph("Next.js App Router live at http://localhost:3000", table_cell_style)
        ],
        [
            Paragraph("8", table_cell_bold),
            Paragraph("Start Mobile Only", table_cell_style),
            Paragraph("<code>pnpm --filter @spendwise/mobile dev</code>", table_cell_mono),
            Paragraph("Expo Metro bundler with QR code for Expo Go", table_cell_style)
        ]
    ]

    cmd_table = Table(commands_data, colWidths=[28, 120, 204, 180])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cmd_table)

    story.append(PageBreak())

    # -------------------------------------------------------------
    # 5. COMPLETE DEPENDENCY & LIBRARY MATRIX
    # -------------------------------------------------------------
    story.append(Paragraph("4. Complete Workspace Dependencies & Libraries", h1_style))
    story.append(Paragraph("All dependencies are locked in <code>pnpm-lock.yaml</code> and will be auto-installed by <code>pnpm install</code>. Here is the categorized architecture reference:", body_style))

    # API Dependencies Table
    story.append(Paragraph("<b>4.1 Backend API Dependencies</b> — <code>apps/api/package.json</code>", h2_style))
    api_deps = [
        [Paragraph("Package", table_header_style), Paragraph("Version", table_header_style), Paragraph("Role / Description", table_header_style)],
        [Paragraph("<code>@nestjs/core, @nestjs/common</code>", table_cell_mono), Paragraph("^10.4.15", table_cell_style), Paragraph("Core NestJS enterprise architecture and dependency injection container", table_cell_style)],
        [Paragraph("<code>@nestjs/mongoose, mongoose</code>", table_cell_mono), Paragraph("^10.1.0 / ^8.9.4", table_cell_style), Paragraph("MongoDB Atlas driver, schemas, models, and aggregation pipeline", table_cell_style)],
        [Paragraph("<code>@nestjs/jwt, passport-jwt</code>", table_cell_mono), Paragraph("^10.2.0 / ^4.0.1", table_cell_style), Paragraph("JWT authentication, access & refresh token verification strategies", table_cell_style)],
        [Paragraph("<code>@node-rs/bcrypt</code>", table_cell_mono), Paragraph("^1.10.7", table_cell_style), Paragraph("High-speed native password hashing and salt verification", table_cell_style)],
        [Paragraph("<code>nodemailer</code>", table_cell_mono), Paragraph("^8.0.4", table_cell_style), Paragraph("Gmail SMTP email engine for sending 6-digit OTP verification codes", table_cell_style)],
        [Paragraph("<code>@nestjs/schedule</code>", table_cell_mono), Paragraph("^6.1.3", table_cell_style), Paragraph("Cron scheduling for automated recurring subscriptions & insights", table_cell_style)],
        [Paragraph("<code>zod</code>", table_cell_mono), Paragraph("^3.24.1", table_cell_style), Paragraph("Type-safe request DTO validation and error parsing", table_cell_style)],
        [Paragraph("<code>@spendwise/ai, @spendwise/shared</code>", table_cell_mono), Paragraph("workspace:*", table_cell_style), Paragraph("Monorepo shared contracts, data types, and AI SDK service", table_cell_style)],
    ]
    t_api = Table(api_deps, colWidths=[150, 65, 317])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 6))

    # Web Dependencies Table
    story.append(Paragraph("<b>4.2 Web Frontend Dependencies</b> — <code>apps/web/package.json</code>", h2_style))
    web_deps = [
        [Paragraph("Package", table_header_style), Paragraph("Version", table_header_style), Paragraph("Role / Description", table_header_style)],
        [Paragraph("<code>next, react, react-dom</code>", table_cell_mono), Paragraph("^15.1.6 / ^18.3.1", table_cell_style), Paragraph("Next.js 15 App Router with React 18 server and client components", table_cell_style)],
        [Paragraph("<code>tailwindcss, autoprefixer</code>", table_cell_mono), Paragraph("^3.4.16", table_cell_style), Paragraph("Modern styling engine with Tailwind CSS design tokens", table_cell_style)],
        [Paragraph("<code>@tanstack/react-query</code>", table_cell_mono), Paragraph("^5.62.9", table_cell_style), Paragraph("Server state caching, automatic refetching, and mutations", table_cell_style)],
        [Paragraph("<code>zustand</code>", table_cell_mono), Paragraph("^5.0.2", table_cell_style), Paragraph("Client-side reactive state (auth tokens, active filters, UI modals)", table_cell_style)],
        [Paragraph("<code>lucide-react</code>", table_cell_mono), Paragraph("^1.7.0", table_cell_style), Paragraph("Crisp SVG iconography library", table_cell_style)],
        [Paragraph("<code>recharts</code>", table_cell_mono), Paragraph("^3.8.1", table_cell_style), Paragraph("Composable financial data charts (bar, line, donut, area)", table_cell_style)],
        [Paragraph("<code>motion</code>", table_cell_mono), Paragraph("^12.42.2", table_cell_style), Paragraph("Smooth layout animations and interactive card transitions", table_cell_style)],
        [Paragraph("<code>@radix-ui/*, @base-ui/react</code>", table_cell_mono), Paragraph("Latest", table_cell_style), Paragraph("Accessible modal dialogs, dropdowns, and dropdown triggers", table_cell_style)],
        [Paragraph("<code>better-auth</code>", table_cell_mono), Paragraph("^1.5.6", table_cell_style), Paragraph("Authentication helpers and session cookies", table_cell_style)],
        [Paragraph("<code>next-themes</code>", table_cell_mono), Paragraph("^0.4.6", table_cell_style), Paragraph("Dark and Light theme switching without flickering", table_cell_style)],
    ]
    t_web = Table(web_deps, colWidths=[150, 65, 317])
    t_web.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_web)
    story.append(Spacer(1, 6))

    # Mobile, AI & Shared Packages Table
    story.append(Paragraph("<b>4.3 Mobile & Internal Packages</b> — <code>apps/mobile</code> & <code>packages/*</code>", h2_style))
    other_deps = [
        [Paragraph("Package / Module", table_header_style), Paragraph("Version", table_header_style), Paragraph("Role / Description", table_header_style)],
        [Paragraph("<code>expo, react-native</code>", table_cell_mono), Paragraph("~52.0.20 / 0.76.5", table_cell_style), Paragraph("Mobile app runtime for iOS, Android, and Web preview", table_cell_style)],
        [Paragraph("<code>@ai-sdk/google, ai</code>", table_cell_mono), Paragraph("^3.0.55 / ^6.0.142", table_cell_style), Paragraph("Vercel AI SDK integration with Google Gemini Generative AI", table_cell_style)],
        [Paragraph("<code>@spendwise/shared</code>", table_cell_mono), Paragraph("workspace:*", table_cell_style), Paragraph("Shared interfaces, DTOs, schemas (Zod), and date utilities", table_cell_style)],
        [Paragraph("<code>@spendwise/ui</code>", table_cell_mono), Paragraph("workspace:*", table_cell_style), Paragraph("Cross-platform design components shared by Web & Mobile", table_cell_style)],
        [Paragraph("<code>turbo, typescript, eslint</code>", table_cell_mono), Paragraph("^2.3.3 / ^5.7.2", table_cell_style), Paragraph("Monorepo build orchestration, type checker & code quality", table_cell_style)],
    ]
    t_other = Table(other_deps, colWidths=[150, 65, 317])
    t_other.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_other)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 6. NEW DEVICE MIGRATION CHECKLIST
    # -------------------------------------------------------------
    story.append(Paragraph("5. New Device Verification Checklist", h1_style))
    checklist_data = [
        [Paragraph("[  ] <b>1.</b> Node.js (v20+ or v22) and pnpm (v9.15.4) installed and accessible via command line.", table_cell_style)],
        [Paragraph("[  ] <b>2.</b> Cloned SpendWise git repository onto new device.", table_cell_style)],
        [Paragraph("[  ] <b>3.</b> Created root <code>.env</code> file with Gmail SMTP credentials.", table_cell_style)],
        [Paragraph("[  ] <b>4.</b> Created <code>apps/api/.env</code> file with MongoDB Atlas connection string & Gemini AI key.", table_cell_style)],
        [Paragraph("[  ] <b>5.</b> Created <code>apps/web/.env</code> and <code>apps/mobile/.env</code> with local API endpoints.", table_cell_style)],
        [Paragraph("[  ] <b>6.</b> Executed <code>pnpm install</code> without dependency errors.", table_cell_style)],
        [Paragraph("[  ] <b>7.</b> Executed <code>pnpm --filter @spendwise/shared build && pnpm --filter @spendwise/ai build</code>.", table_cell_style)],
        [Paragraph("[  ] <b>8.</b> Started server with <code>pnpm dev</code> and confirmed API (4000) and Web (3000) are running smoothly.", table_cell_style)],
    ]
    t_check = Table(checklist_data, colWidths=[532])
    t_check.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_check)

    # Build document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Migration PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_pdf = os.path.join(root_dir, "SpendWise_New_Device_Migration_Guide.pdf")
    create_migration_pdf(target_pdf, root_dir)
    
    docs_pdf = os.path.join(root_dir, "docs", "SpendWise_New_Device_Migration_Guide.pdf")
    create_migration_pdf(docs_pdf, root_dir)
