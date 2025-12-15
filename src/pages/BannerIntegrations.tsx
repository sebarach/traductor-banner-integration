import AcademicPeriods from './AcademicPeriods'
import AcademicLevels from './AcademicLevels'
import ProgramRules from './ProgramRules'
import Buildings from './Buildings'
import Persons from './Persons'
import Instructors from './Instructors'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Calendar, Link2, Layers, FileText, Building, Users, GraduationCap } from 'lucide-react'

export default function BannerIntegrations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Integraciones Banner"
        description="Gestión de integraciones con el sistema Banner"
        icon={<Link2 className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Módulos Activos',
            value: '6',
            icon: <Calendar className="h-5 w-5" />
          },
          {
            label: 'Próximamente',
            value: '0',
            icon: '🔜'
          },
          {
            label: 'Estado',
            value: 'Operativo',
            icon: '✅'
          }
        ]}
      />

      {/* Tabs Card */}
      <Card className="shadow-lg">
        <Tabs defaultValue="academic-periods" className="w-full">
          <TabsList className="w-full grid grid-cols-6 h-auto p-1 bg-muted/50">
            <TabsTrigger
              value="academic-periods"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Períodos Académicos</span>
              <span className="sm:hidden">Períodos</span>
            </TabsTrigger>
            <TabsTrigger
              value="academic-levels"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Niveles Académicos</span>
              <span className="sm:hidden">Niveles</span>
            </TabsTrigger>
            <TabsTrigger
              value="program-rules"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reglas de Programas</span>
              <span className="sm:hidden">Programas</span>
            </TabsTrigger>
            <TabsTrigger
              value="buildings"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Edificios</span>
              <span className="sm:hidden">Edificios</span>
            </TabsTrigger>
            <TabsTrigger
              value="persons"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Personas</span>
              <span className="sm:hidden">Personas</span>
            </TabsTrigger>
            <TabsTrigger
              value="instructors"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Instructores</span>
              <span className="sm:hidden">Instructores</span>
            </TabsTrigger>
          </TabsList>

          {/* Academic Periods Tab */}
          <TabsContent value="academic-periods" className="p-6">
            <AcademicPeriods />
          </TabsContent>

          {/* Academic Levels Tab */}
          <TabsContent value="academic-levels" className="p-6">
            <AcademicLevels />
          </TabsContent>

          {/* Program Rules Tab */}
          <TabsContent value="program-rules" className="p-6">
            <ProgramRules />
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="p-6">
            <Buildings />
          </TabsContent>

          {/* Persons Tab */}
          <TabsContent value="persons" className="p-6">
            <Persons />
          </TabsContent>

          {/* Instructors Tab */}
          <TabsContent value="instructors" className="p-6">
            <Instructors />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
