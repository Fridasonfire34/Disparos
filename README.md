# Sistema de Gestión de Disparos y Travelers

Sistema web para la gestión de programación de producción (disparos) y generación de documentos de trabajo (travelers) para plantas de manufactura automotriz.

## 🚀 Características Principales

### Gestión de Disparos

- **Nuevo Disparo**: Crear programación de producción desde archivos CSV
- **Disparo Completo**: Visualización y gestión de disparos generados
- **Control de Disparos**: Monitoreo y seguimiento de disparos activos
- **Disparo Preliminar**: Vista previa de programación antes de confirmar

### Gestión de Travelers

- **Carga CSV**: Importación masiva de datos de travelers
- **Generación de PDFs**: Creación automática de documentos de trabajo por secuencia
- **Descarga en ZIP**: Empaquetado de todos los travelers y documentos auxiliares
- **Excel Doc Escaner**: Generación automática de archivos Excel para sistema de escaneo

### Módulos Adicionales

- **Familias**: Gestión de familias de productos
- **Secuencias Viper/BOA**: Control de secuencias de producción por línea
- **Varianzas**: Análisis y gestión de varianzas de producción
- **Update Schedule**: Actualización de programación de producción

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: SQL Server (mssql)
- **Generación de PDFs**: Puppeteer
- **Procesamiento Excel**: ExcelJS
- **Procesamiento de Archivos**: Formidable
- **Compresión**: Archiver

## 📋 Requisitos Previos

- Node.js 20.x o superior
- SQL Server con bases de datos:
  - `Disparos`
  - `Travelers`
- Fuente de barcode: Free 3 of 9 (`public/fonts/FRE3OF9X.TTF`)

## ⚙️ Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd disparo
```

2. **Instalar dependencias**

```bash
npm install
```

⚠️ **Recomendación**: Migrar credenciales a variables de entorno antes de producción.

3. **Ejecutar en modo desarrollo**

```bash
npm run dev
```

4. **Abrir en navegador**

```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
disparo/
├── app/
│   ├── components/
│   │   └── DisparoScreen.tsx          # Pantalla principal de disparos
│   ├── controlDisparos/               # Control de disparos activos
│   ├── disparo/                       # Nuevo disparo
│   ├── disparoCompleto/               # Vista de disparo completo
│   ├── familias/                      # Gestión de familias
│   ├── secuenciasViperBoa/            # Secuencias por línea
│   ├── travelers/                     # Gestión de travelers
│   ├── updateSchedule/                # Actualización de programación
│   └── varianzas/                     # Gestión de varianzas
├── pages/
│   └── api/
│       └── Disparo/
│           ├── ProcessCSVTravelers.ts       # Procesamiento de CSV
│           ├── CheckTravelersSol.ts         # Validación y preparación
│           ├── PrepareTravelersTables.ts    # Población de tablas
│           ├── GetTravelersCompleteData.ts  # Obtención de datos
│           ├── GenerateTravelersZip.ts      # Generación de ZIP
│           └── ...                          # Más de 50 endpoints
└── public/
    └── fonts/
        └── FRE3OF9X.TTF                     # Fuente de barcode
```

## 🔄 Flujo de Trabajo - Travelers

1. **Cargar CSV**: Subir archivo CSV con datos de travelers
2. **Procesamiento Automático**:
   - Limpieza de tablas `SOL`, `Valores Unicos`, `Doc Escaner`
   - Inserción de datos desde CSV
   - Duplicación de filas según cantidad
   - Normalización de campos (Semana, Línea)
   - Actualización de grupos logísticos
   - Generación de nombres de travelers
   - Población de tablas de colores (BOA/VIPER/CDU)
   - Actualización de Kanban para tablas VIPER
3. **Guardar Todos**: Generar y descargar ZIP con:
   - PDFs individuales por traveler
   - Excel de Doc Escaner

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### SOL

- `Work Order`, `Child Material`, `Child Description`
- `Qty`, `Logistic Group`, `Packing`
- `TRAVEL NAME`, `Linea`, `BalloonNumber`
- `Color Grupo`, `Semana`, `Supply ID`, `LG Color ID`

#### Packings

Similar a SOL + campo `Año`

#### Tablas de Color

- **BOA**: `Tabla Verde BOA`, `Tabla Azul BOA`, `Tabla Amarillo BOA`
- **VIPER**: `Tabla Rosa VIPER`, `Tabla Verde VIPER`, `Tabla Amarillo VIPER`
- **CDU**: Usa tablas VIPER mapeadas por color

#### Doc Escaner

- `PartNumber`, `BuildSequence`, `BalloonNumber`
- `Qty`, `PONo`, `VendorNo`
- `PackingDiskNo`, `Linea`

## 📄 Formato de PDF Travelers

Cada PDF incluye:

- **Header**: Fecha/hora, número de semana, número de página
- **Título**: Nombre de secuencia limpio
- **Tabla**: Columnas Mat'l, N. parte, Sec, Rev, Cant, Prog, Embarques, Packing (barcode), Kanban, Liberado
- **Footer**: Cart Name, Sequence, Total Parts

## 🎨 Características Técnicas

- **Paginación**: 38 filas por página (configurable)
- **Barcode**: Fuente Free 3 of 9 para columna Packing
- **Márgenes PDF**: Top/Bottom 15px, Left/Right 5px
- **Formato Excel**: Headers con fondo cyan, bordes gruesos, autofit
- **Nombre ZIP**: `Travelers-DISPARO-[fecha]-[hora].zip`

## 📦 APIs Principales

### Travelers

- `POST /api/Disparo/ProcessCSVTravelers` - Procesar CSV de travelers
- `POST /api/Disparo/CheckTravelersSol` - Validar y preparar datos
- `POST /api/Disparo/PrepareTravelersTables` - Poblar tablas de colores
- `GET /api/Disparo/GetTravelersCompleteData` - Obtener datos completos
- `POST /api/Disparo/GenerateTravelersZip` - Generar ZIP con PDFs y Excel

### Disparos

- `GET /api/Disparo/GetFamilias` - Obtener familias
- `POST /api/Disparo/AddCajaAuto` - Agregar caja automática
- `GET /api/Disparo/GetVarianzas` - Obtener varianzas
- `POST /api/Disparo/ExportDisparo` - Exportar disparo

## 🔐 Seguridad

⚠️ **Importante**: Este código contiene credenciales hardcodeadas. Antes de subir a producción:

- Migrar credenciales a variables de entorno (`.env.local`)
- Implementar manejo seguro de secretos
- Configurar autenticación y autorización
- Validar inputs de usuario
- Implementar rate limiting

## 🚀 Compilación para Producción

```bash
npm run build
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es de uso interno para gestión de producción.

## 👥 Autores

Desarrollado para operaciones de manufactura automotriz.

---

**Nota**: Este sistema está optimizado para líneas de producción BOA, VIPER y CDU. Personalizar según necesidades específicas de tu planta.
