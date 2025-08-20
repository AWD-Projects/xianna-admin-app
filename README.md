# Xianna Admin App v2.0

Panel de administración moderno para Xianna, construido con Next.js 14, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

- ✅ **Next.js 14** con App Router
- ✅ **TypeScript** para type safety
- ✅ **Tailwind CSS** para styling consistente
- ✅ **Redux Toolkit** para state management
- ✅ **Supabase** para base de datos y autenticación
- ✅ **Radix UI** para componentes accesibles
- ✅ **ApexCharts** para visualización de datos
- ✅ **React Hook Form + Zod** para formularios
- ✅ **Framer Motion** para animaciones
- ✅ **Sonner** para notificaciones

## 📊 Funcionalidades Migradas

### ✅ Autenticación
- Login de administrador con validación de email
- Protección de rutas con middleware
- Gestión de sesiones con Supabase Auth

### ✅ Dashboard Principal
- **Insights**: Analíticas y métricas clave
- **Usuarios**: Gestión de usuarios registrados
- **Blogs**: CRUD completo de blogs con editor rich text
- **Catálogo**: Gestión de outfits y prendas
- **Formulario**: Gestión del cuestionario de estilos

### ✅ Analíticas (Insights)
- Total de usuarios y nuevos usuarios del mes
- Distribución de usuarios por estilo, ciudad, edad y tipo de cuerpo
- Analíticas de blogs: ratings, categorías más populares
- Analíticas de outfits: más guardados, por estilo y ocasión
- Métricas del cuestionario de estilos

### ✅ Gestión de Usuarios
- Vista de todos los usuarios registrados
- Detalles completos de perfil de usuario
- Exportación a Excel de datos de usuarios
- Paginación y búsqueda

### ✅ Gestión de Blogs
- CRUD completo de blogs
- Editor de texto rico (React Quill)
- Gestión de múltiples imágenes por blog
- Categorización de contenido
- Sistema de ratings y métricas
- Exportación de reportes

### ✅ Gestión de Catálogo
- CRUD de outfits con imágenes
- Gestión de prendas asociadas
- Categorización por estilos y ocasiones
- Seguimiento de favoritos
- Exportación de datos

### ✅ Gestión de Cuestionario
- CRUD de preguntas del test de estilo
- Gestión de respuestas con identificadores
- Asociación de respuestas con estilos
- Exportación de estructura completa

## 🎨 Diseño y UX

### Colores de Marca
- **Pink**: #E61F93 (color principal)
- **Yellow**: #FDE12D (secundario)
- **Blue**: #00D1ED (acento)

### Componentes UI
- Botones redondeados (20px)
- Inputs con altura consistente (48px)
- Cards con sombras sutiles
- Iconografía moderna con Lucide React

## 🔧 Instalación y Setup

### Prerrequisitos
- Node.js 18+
- npm o yarn

### 1. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 2. Configurar variables de entorno
Copia `.env.local` y configura las variables:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXTAUTH_SECRET=tu_secret_key
NEXT_PUBLIC_SUPABASE_STORAGE_URL=tu_storage_url
NEXT_PUBLIC_BLOGS_BUCKET=Blogs
NEXT_PUBLIC_OUTFITS_BUCKET=Outfits
NEXT_PUBLIC_ADMIN_EMAIL=admin@xianna.com
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
# o
yarn dev
```

### 4. Acceso de administrador
- URL: `http://localhost:3002`
- Email: El configurado en `NEXT_PUBLIC_ADMIN_EMAIL`
- Contraseña: Tu contraseña de Supabase

## 🗃️ Estructura de Base de Datos

El proyecto utiliza la misma estructura de base de datos que la v1:

### Tablas Principales
- `user_details` - Información de usuarios
- `blogs` - Contenido de blogs
- `categoria_blog` - Categorías de blogs
- `blogs_calificados` - Ratings de blogs
- `outfits` - Catálogo de outfits
- `prendas` - Prendas de cada outfit
- `estilos` - Tipos de estilo
- `ocasiones` - Ocasiones para outfits
- `preguntas` - Preguntas del cuestionario
- `respuestas` - Respuestas del cuestionario
- `favoritos` - Outfits favoritos de usuarios

### Storage Buckets
- `Blogs` - Imágenes de blogs
- `Outfits` - Imágenes de outfits y prendas

## 📱 Responsive Design

- **Mobile First**: Diseño adaptable desde móvil
- **Sidebar Collapsible**: Navegación optimizada para móviles
- **Tables Responsive**: Tablas con scroll horizontal en móviles
- **Touch Friendly**: Botones y controles optimizados para touch

## 🚀 Deploy

### Netlify
```bash
npm run build
```

### Configuración de producción
- Actualizar `NEXT_PUBLIC_APP_URL` con tu dominio
- Configurar redirects en Netlify para SPA
- Verificar configuración de Supabase para producción

## 🔐 Seguridad

- **Middleware de autenticación**: Protege todas las rutas automáticamente
- **Validación de admin**: Solo emails autorizados pueden acceder
- **RLS en Supabase**: Row Level Security configurado
- **Validación de formularios**: Zod schemas para validación

## 📊 Métricas y Analíticas

### Dashboards Incluidos
1. **Usuarios**: Demografía, estilos, ubicación
2. **Contenido**: Performance de blogs y catálogo
3. **Engagement**: Favoritos, ratings, interacciones
4. **Cuestionario**: Distribución de respuestas por estilo

### Exportaciones
- Excel para todos los módulos
- Reportes con filtros de fecha
- Datos formateados para análisis

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 Notas de Migración

### Cambios principales de v1 a v2
1. **React** → **Next.js 14** con App Router
2. **Material-UI** → **Radix UI + Tailwind CSS**
3. **Direct Supabase calls** → **Redux Toolkit + Supabase SSR**
4. **React Router** → **Next.js routing**
5. **MUI Snackbar** → **Sonner notifications**
6. **ApexCharts** → Mantenido para compatibilidad

### Beneficios de la migración
- ⚡ **Performance**: SSR y optimizaciones de Next.js
- 🎨 **Consistencia**: Diseño unificado con user app
- 🔧 **Mantenibilidad**: Código más limpio y tipado
- 📱 **UX mejorada**: Interfaz más moderna y responsive
- 🔒 **Seguridad**: Mejor manejo de autenticación

## 📞 Soporte

Para problemas o preguntas sobre la migración, contacta al equipo de desarrollo.

---

**Xianna Admin v2.0** - Construido con ❤️ para gestionar tu plataforma de moda
# xianna-admin-app
