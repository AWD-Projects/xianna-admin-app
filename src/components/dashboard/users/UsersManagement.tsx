'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCardSkeleton, UserCardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { fetchAllUsers, setSelectedUser, clearSelectedUser } from '@/store/slices/userSlice'
import type { AppDispatch, RootState } from '@/store'
import type { User } from '@/types'
import { Download, User as UserIcon, Search, Filter, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export function UsersManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { users, selectedUser, loading, error, pagination } = useSelector(
    (state: RootState) => state.user
  )
  
  // Local state for filtering and search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedOccupation, setSelectedOccupation] = useState('')

  useEffect(() => {
    dispatch(fetchAllUsers())
  }, [dispatch])

  const handleSelectUser = (user: User) => {
    dispatch(setSelectedUser(user))
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesState = selectedState === '' || user.estado === selectedState
    const matchesGender = selectedGender === '' || user.genero === selectedGender
    const matchesOccupation = selectedOccupation === '' || user.ocupacion === selectedOccupation
    
    return matchesSearch && matchesState && matchesGender && matchesOccupation
  })

  // Calculate statistics
  const getUserStats = () => {
    const totalUsers = users.length
    const usersWithAge = users.filter(user => user.edad && user.edad > 0)
    const avgAge = usersWithAge.length > 0 
      ? usersWithAge.reduce((sum, user) => sum + user.edad, 0) / usersWithAge.length 
      : 0
    
    // Get unique values for filters
    const uniqueStates = Array.from(new Set(users.map(user => user.estado).filter(Boolean)))
    const uniqueGenders = Array.from(new Set(users.map(user => user.genero).filter(Boolean)))
    const uniqueOccupations = Array.from(new Set(users.map(user => user.ocupacion).filter(Boolean)))
    
    // Most common values
    const stateCounts = users.reduce((acc, user) => {
      if (user.estado) acc[user.estado] = (acc[user.estado] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const genderCounts = users.reduce((acc, user) => {
      if (user.genero) acc[user.genero] = (acc[user.genero] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostCommonState = Object.entries(stateCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    const mostCommonGender = Object.entries(genderCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    
    return {
      totalUsers,
      avgAge: Math.round(avgAge),
      uniqueStates,
      uniqueGenders,
      uniqueOccupations,
      mostCommonState,
      mostCommonGender,
      filteredCount: filteredUsers.length
    }
  }

  const stats = getUserStats()

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedState('')
    setSelectedGender('')
    setSelectedOccupation('')
  }

  const getStyleName = (tipoEstilo: number) => {
    const styleMap: { [key: number]: string } = {
      1: 'Casual',
      2: 'Elegante',
      3: 'Deportivo',
      4: 'Boho',
      5: 'Minimalista',
      6: 'Rockero',
      7: 'Vintage'
    }
    return styleMap[tipoEstilo] || `Estilo ${tipoEstilo}`
  }

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No hay usuarios para exportar')
      return
    }

    const data = filteredUsers.map(user => ({
      Nombre: user.nombre,
      Correo: user.correo,
      Estado: user.estado,
      Ocupación: user.ocupacion,
      Género: user.genero,
      Edad: user.edad,
      Talla: user.talla,
      'Tipo de cuerpo': user.tipo_cuerpo,
      'Tipo de estilo': getStyleName(user.tipo_estilo),
      'ID Usuario': user.id
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `usuarios_${date}.csv`
    
    // Export as CSV
    XLSX.writeFile(wb, filename, { bookType: 'csv' })
    toast.success('Usuarios exportados exitosamente')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona y analiza los usuarios de tu plataforma
          </p>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-end gap-3">
          <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Filters Skeleton */}
        <div className="p-6 border rounded-lg bg-white">
          <div className="space-y-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* Users List Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users List */}
          <div className="space-y-4">
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
          
          {/* User Details */}
          <div className="border rounded-lg bg-white p-6">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona y analiza los usuarios registrados en la plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV ({stats.filteredCount})
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demographic Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Demografía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{stats.avgAge}</div>
              <p className="text-sm text-gray-600">Edad promedio</p>
            </div>
            <div>
              <div className="text-lg font-semibold">{stats.mostCommonGender}</div>
              <p className="text-sm text-gray-600">Género más común</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-lg font-semibold">{stats.mostCommonState}</div>
              <p className="text-sm text-gray-600">Estado más común</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.uniqueStates.length}</div>
              <p className="text-sm text-gray-600">Estados únicos</p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Profesional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{stats.uniqueOccupations.length}</div>
              <p className="text-sm text-gray-600">Ocupaciones únicas</p>
            </div>
            <div>
              <div className="text-lg font-semibold">{stats.totalUsers}</div>
              <p className="text-sm text-gray-600">Total usuarios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            {stats.filteredCount} de {stats.totalUsers} usuarios
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por estado
            </label>
            <Select value={selectedState || undefined} onValueChange={(value) => setSelectedState(value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                {stats.uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por género
            </label>
            <Select value={selectedGender || undefined} onValueChange={(value) => setSelectedGender(value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                {stats.uniqueGenders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por ocupación
            </label>
            <Select value={selectedOccupation || undefined} onValueChange={(value) => setSelectedOccupation(value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las ocupaciones" />
              </SelectTrigger>
              <SelectContent>
                {stats.uniqueOccupations.map((occupation) => (
                  <SelectItem key={occupation} value={occupation}>
                    {occupation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || selectedState || selectedGender || selectedOccupation) && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Lista de Usuarios
                <span className="text-sm font-normal text-gray-500">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
                  {filteredUsers.length !== users.length && (
                    <span className="ml-1 text-gray-400">de {users.length}</span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-pink-50 border-pink-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{user.nombre || 'Sin nombre'}</h3>
                        <p className="text-sm text-gray-600">{user.correo || 'Sin correo'}</p>
                        <div className="flex gap-1 mt-1">
                          {user.estado && (
                            <Badge variant="secondary" className="text-xs">
                              {user.estado}
                            </Badge>
                          )}
                          {user.edad && (
                            <Badge variant="outline" className="text-xs">
                              {user.edad} años
                            </Badge>
                          )}
                          {user.genero && (
                            <Badge variant="outline" className="text-xs">
                              {user.genero}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {users.length === 0 ? 'No hay usuarios disponibles' : 'No hay usuarios que coincidan con los filtros'}
                  </p>
                  {users.length > 0 && filteredUsers.length === 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-6">
                  {/* User Header */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedUser.nombre || 'Sin nombre'}</h2>
                      <p className="text-gray-600">{selectedUser.correo || 'Sin correo'}</p>
                    </div>
                  </div>

                  {/* User Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <p className="text-lg">{selectedUser.estado || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ocupación</label>
                      <p className="text-lg">{selectedUser.ocupacion || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Género</label>
                      <p className="text-lg">{selectedUser.genero || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Edad</label>
                      <p className="text-lg">{selectedUser.edad ? `${selectedUser.edad} años` : 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Talla</label>
                      <p className="text-lg">{selectedUser.talla || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Cuerpo</label>
                      <p className="text-lg">{selectedUser.tipo_cuerpo || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estilo Preferido</label>
                      <p className="text-lg">{selectedUser.tipo_estilo ? getStyleName(selectedUser.tipo_estilo) : 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID de Usuario</label>
                      <p className="text-lg font-mono text-gray-600">#{selectedUser.id}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Selecciona un usuario para ver sus detalles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
