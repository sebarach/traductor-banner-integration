// Tipos TypeScript para la API Traductor SIS

export interface AcademicPeriod {
  code: string
  desc: string
  acyrCode: string
  trmtCode: string
  trmtDesc: string
  startDate: string
  endDate: string
  periodGroup: string
  periodDesc: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

export interface AcademicLevel {
  code: string
  desc: string
}

export interface ProgramRule {
  program: string
  programDesc: string
  levlCodeStu: string
  campCode: string
  collCode: string
  degcCode: string
  levlDesc: string
  campDesc: string
  collDesc: string
  degcDesc: string
  programDesc_01: string
  programDesc_02: string
}

export interface BuildingAttribute {
  rdefCode: string
  rdefDesc: string
}

export interface Building {
  buildingCode: string
  buildingDesc: string
  campCode: string
  siteCode: string
  streetLine1: string
  streetLine2: string
  streetLine3: string
  city: string
  stateCode: string
  stateDesc: string
  zip: string
  capacity: number
  maxCapacity: number
  buildingAttributes: BuildingAttribute[]
}

export interface PersonEmail {
  pidm: number
  emalCode: string
  emalCodeDesc: string
  emailAddress: string
  statusInd: string
  preferredInd: string
  comment: string
  dispWebInd: string
}

export interface Person {
  pidm: number
  bannerId: string
  passportId: string
  ntypCode: string
  ntypCodeDesc: string
  firstName: string
  middleName: string
  lastName: string
  prefFirstName: string
  legalName: string
  sex: string
  birthDate: string
  emails: PersonEmail[]
}

export interface InstructorDepartment {
  deptCode: string
}

export interface Instructor {
  bannerId: string
  firstName: string
  lastName: string
  sex: string
  emailAddress: string
  fcstCode: string
  departments: InstructorDepartment[]
  fctgCode: string
  activityDate: string
}

export interface ApiError {
  message: string
  status: number
  details?: unknown
}
