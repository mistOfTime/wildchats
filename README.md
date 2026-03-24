# WildChats 🐾💬

A real-time chat application with CIT branding featuring maroon and gold theme colors.

![WildChats](https://img.shields.io/badge/WildChats-Live-orange)

## ✨ Features

- 💬 **Real-time Messaging** - Instant message delivery with live updates
- 👤 **User Profiles** - Customizable profiles with avatars and cover photos
- 🟢 **Online Status** - See who's online/offline in real-time
- ⌨️ **Typing Indicators** - Know when someone is typing
- 📷 **Image Sharing** - Share images in conversations
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔐 **Secure Authentication** - Email/password authentication with Supabase
- 🎨 **Custom Theme** - CIT maroon and gold branding

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Real-time, Storage, Auth)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/mistOfTime/wildchats.git
cd wildchats
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database

Run the SQL scripts in your Supabase SQL editor in this order:
- `supabase-setup.sql`
- `ADD-BIO-COLUMN.sql`
- `ADD-IMAGE-URL-COLUMN.sql`
- `ADD-COVER-URL-COLUMN.sql`
- `CREATE-BUCKET.sql`
- `CREATE-CHAT-IMAGES-BUCKET.sql`

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
chat-app/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ChatLayout.tsx     # Main chat layout
│   ├── ChatWindow.tsx     # Chat interface
│   ├── UserList.tsx       # User sidebar
│   ├── ProfileView.tsx    # Profile viewer
│   ├── ProfileEdit.tsx    # Profile editor
│   └── ...
├── lib/                   # Utilities and hooks
│   ├── supabase.ts       # Supabase client
│   ├── auth.ts           # Authentication
│   └── hooks/            # Custom React hooks
└── public/               # Static assets
```

## 🎨 Theme Colors

- **Primary**: Maroon (#7F1D1D - red-800)
- **Secondary**: Gold (#CA8A04 - yellow-600)
- **Accent**: Amber (#D97706 - amber-600)

## 🔗 Links

- **GitHub**: [mistOfTime](https://github.com/mistOfTime)
- **LinkedIn**: [Sien Jandave Saldaña](https://www.linkedin.com/in/sien-jandave-saldaña-198257320)
- **Instagram**: [@0101010101_777](https://www.instagram.com/0101010101_777)

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

Created by **Sien Jandave Saldaña**

---

Made with ❤️ for CIT
