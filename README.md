# PhotoMeet - Plataforma de Eventos para Fotógrafos

PhotoMeet es una plataforma web moderna que conecta fotógrafos y organiza eventos fotográficos. Permite a los usuarios publicar eventos, compartir fotos, interactuar con otros fotógrafos y mantener un calendario de eventos.

## 🚀 Características

- 📸 Publicación y visualización de eventos fotográficos
- 👥 Sistema de registro e inicio de sesión
- 💬 Comentarios en publicaciones
- 📅 Calendario de eventos
- 🖼️ Galería de fotos por evento
- 📱 Diseño responsivo
- 🌙 Modo oscuro/claro

## 🛠️ Tecnologías Utilizadas

- HTML5, CSS3, JavaScript
- Bootstrap 5
- Supabase (Autenticación y Base de datos)
- AOS.js (Animaciones)
- SweetAlert2 (Modales)
- Vite (Bundler)

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- Cuenta en Supabase

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/photomeet.git
cd photomeet
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_KEY=tu_key_de_supabase
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## 📦 Estructura del Proyecto

```
photomeet/
├── public/
│   └── img/
├── src/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── components/
├── index.html
├── package.json
└── README.md
```

## 🔐 Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Configura las siguientes tablas:

### Tabla: users
- id (uuid, primary key)
- name (text)
- email (text, unique)
- created_at (timestamp)

### Tabla: events
- id (uuid, primary key)
- title (text)
- description (text)
- date (timestamp)
- location (text)
- image_url (text)
- featured (boolean)
- created_by (uuid, foreign key -> users.id)

### Tabla: comments
- id (uuid, primary key)
- content (text)
- event_id (uuid, foreign key -> events.id)
- user_id (uuid, foreign key -> users.id)
- created_at (timestamp)

## 🚀 Despliegue

El proyecto está configurado para ser desplegado en Netlify. Para desplegar:

1. Conecta tu repositorio de GitHub con Netlify
2. Configura las variables de entorno en Netlify
3. Deploy automático con cada push a main

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 📧 Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@ejemplo.com

Link del Proyecto: [https://github.com/tu-usuario/photomeet](https://github.com/tu-usuario/photomeet) 

