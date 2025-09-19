// Admin-specific types
export interface AdminUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// Advisor management types
export interface Advisor {
  id: number
  created_at: string
  nombre: string
  correo: string
  genero: string
  especialidad: string
  anos_experiencia: number
  biografia: string
  contact_link: string
  portfolio_url: string
  pais: string
  estado: string
  activo: boolean
}

// User management types
export interface User {
  id: number
  correo: string
  estado: string
  nombre: string
  tipo_estilo: number
  ocupacion: string
  edad: number
  talla: string
  tipo_cuerpo: string
  genero: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  correo: string
  nombre: string
  genero?: string
  edad?: number
  ocupacion?: string
  talla?: string
  tipo_cuerpo?: string
  estado?: string
  tipo_estilo?: number
  created_at: string
  updated_at: string
}

// Blog management types
export interface Blog {
  id: number
  titulo: string
  descripcion: string
  contenido: string
  id_categoria: number
  categoria: string
  image: string
  name: string
  category: string
  rating: number
  persons: number
  images: string[]
  additionalImages?: string[]
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: number
  categoria: string
}

export interface BlogRating {
  id: number
  blog: number
  calificacion: number
  usuario: string
  created_at: string
}

// Catalog management types
export interface Outfit {
  id: number
  nombre: string
  descripcion: string
  id_estilo: number
  estilo: string
  imagen: string
  precio?: number
  ocasiones: string[]
  favoritos: number
  created_at: string
  updated_at: string
  ocasion?: string
  advisor_id?: number
  advisor?: {
    id: number
    nombre: string
    especialidad: string
  }
  estilos?: {
    id: number
    tipo: string
    descripcion: string
  }
}

export interface Prenda {
  id: number
  nombre: string
  link: string
  id_outfit: number
  imagen?: string // URL de la imagen si existe
}

// Tipo para prenda en el formulario
export interface PrendaFormData {
  nombre: string
  link: string
  imagen?: File // Archivo de imagen para subir
}

// Actualizar OutfitFormData para incluir imágenes en prendas
export interface OutfitFormData {
  nombre: string
  descripcion: string
  id_estilo: number
  ocasiones: number[]
  imagen?: File
  prendas: PrendaFormData[]
  advisor_id?: number
}

export interface Style {
  id: number
  tipo: string
  descripcion: string
}

export interface Occasion {
  id: number
  ocasion: string
}

// Questionnaire management types
export interface Question {
  id: number
  pregunta: string
  answers: Answer[]
}

export interface Answer {
  id: number
  respuesta: string
  identificador: string
  id_estilo: number
  id_pregunta: number
}

export interface Estilo {
  id: number
  tipo: string
  descripcion: string
}

// Analytics and insights types
export interface UserAnalytics {
  totalUsers: number
  newUsersThisMonth: number
  usersByStyle: { style: string; count: number }[]
  usersByState: { state: string; count: number }[]
  usersByAge: { range: string; count: number }[]
  usersByBodyType: { type: string; count: number }[]
}

export interface BlogAnalytics {
  totalBlogs: number
  totalRatings: number
  averageRating: number
  mostPopularCategory: string
  blogsByCategory: { category: string; count: number }[]
  ratingDistribution: { rating: number; count: number }[]
  blogRatings: { blog: string; averageRating: number }[]
}

export interface OutfitAnalytics {
  totalOutfits: number
  totalFavorites: number
  mostSavedOutfit: string
  outfitsByStyle: { style: string; count: number }[]
  outfitsByOccasion: { occasion: string; count: number }[]
  outfitFavorites: { outfit: string; favorites: number }[]
}

export interface QuestionnaireAnalytics {
  totalQuestions: number
  totalAnswers: number
  answersByStyle: { style: string; count: number }[]
}

// Dashboard analytics combined
export interface DashboardInsights {
  users: UserAnalytics
  blogs: BlogAnalytics
  outfits: OutfitAnalytics
  questionnaire: QuestionnaireAnalytics
}

// Form types
export interface BlogFormData {
  titulo: string
  descripcion: string
  contenido: string
  id_categoria: number
  images?: File[] // Imágenes nuevas a subir
  imagesToDelete?: string[] // URLs de imágenes existentes a eliminar
}

export interface OutfitFormData {
  nombre: string
  descripcion: string
  id_estilo: number
  ocasiones: number[]
  imagen?: File
  prendas: PrendaFormData[]
  advisor_id?: number
}

export interface AdvisorFormData {
  nombre: string
  correo: string
  genero: string
  especialidad: string
  anos_experiencia: number
  biografia: string
  contact_link: string
  portfolio_url: string
  pais: string
  estado: string
  activo: boolean
}

// Style management types
export interface StyleFormData {
  tipo: string
  descripcion: string
}

// Occasion management types  
export interface OccasionFormData {
  ocasion: string
}

export interface PrendaFormData {
  nombre: string
  link: string
}

export interface QuestionFormData {
  pregunta: string
  answers: AnswerFormData[]
}

export interface AnswerFormData {
  id?: number
  respuesta: string
  identificador: string
  id_estilo: number
}

// Chart data types
export interface ChartData {
  categories: string[]
  series: number[] | { name: string; data: number[] }[]
}

export interface DonutChartData {
  labels: string[]
  series: number[]
}

export interface BarChartData {
  categories: string[]
  series: { name: string; data: number[] }[]
}

// Table types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}

// File upload types
export interface ImageFileWithPreview {
  file: File
  preview: string
}

export interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter types
export interface UserFilters {
  style?: number[]
  ageRange?: string[]
  state?: string[]
  occupation?: string[]
  gender?: string[]
  size?: string[]
  bodyType?: string[]
}

export interface BlogFilters {
  category?: number[]
  rating?: number[]
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface OutfitFilters {
  style?: number[]
  occasion?: number[]
  favorites?: number
}

// Export utilities
export interface ExportOptions {
  format: 'excel' | 'csv'
  filename?: string
  includeImages?: boolean
  dateRange?: {
    from: Date
    to: Date
  }
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Settings types
export interface AdminSettings {
  siteName: string
  siteDescription: string
  adminEmail: string
  notificationsEnabled: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  theme: 'light' | 'dark' | 'system'
}

// Newsletter campaign types
export interface NewsletterCampaign {
  id: number
  created_at: string
  nombre: string
  asunto: string
  template_usado: string
  numero_usuarios_enviados: number
  filtros_aplicados: string
  emails: string
}

export interface NewsletterTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
}

export interface NewsletterFormData {
  nombre: string
  asunto: string
  template_usado: string
  filtros_aplicados: NewsletterFilters
  selectedEmails: string[]
}

export interface NewsletterFilters {
  estado?: string
  genero?: string
  edad_min?: number
  edad_max?: number
  tipo_estilo?: string
  ocupacion?: string
}

export interface SelectedUser {
  id: number
  nombre: string
  correo: string
  estado: string
  genero: string
  edad: number
  tipo_estilo: number
  ocupacion: string
  selected: boolean
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}
