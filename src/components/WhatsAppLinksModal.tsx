'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppLink {
  userId: number
  userName: string
  userEmail: string
  userPhone: string
  whatsappLink: string
}

interface WhatsAppLinksModalProps {
  isOpen: boolean
  onClose: () => void
  links: WhatsAppLink[]
}

export function WhatsAppLinksModal({ isOpen, onClose, links }: WhatsAppLinksModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyLink = (link: string, index: number) => {
    navigator.clipboard.writeText(link)
    setCopiedIndex(index)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank')
  }

  const handleOpenAll = () => {
    links.forEach((linkData, index) => {
      setTimeout(() => {
        window.open(linkData.whatsappLink, '_blank')
      }, index * 500)
    })
    toast.success('Abriendo todos los enlaces...')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enlaces de WhatsApp Generados</DialogTitle>
          <DialogDescription>
            Se generaron {links.length} enlaces de WhatsApp. Haz clic en cada enlace para enviar el mensaje.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center pb-3 border-b">
            <p className="text-sm text-gray-600">
              Total: {links.length} enlaces
            </p>
            <Button onClick={handleOpenAll} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir todos
            </Button>
          </div>

          <div className="space-y-3">
            {links.map((linkData, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {linkData.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{linkData.userId}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {linkData.userEmail}
                    </div>
                    <div className="text-sm text-green-600 font-mono">
                      {linkData.userPhone}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(linkData.whatsappLink, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenLink(linkData.whatsappLink)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
