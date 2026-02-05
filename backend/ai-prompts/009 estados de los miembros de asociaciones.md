crea modelo y migraciones para associationMemberStatusType: 
id: autonumérico smallInt
name: string, unico, obligatorio
campos timestamp habituales
hazle un feeder para estos valores de name: Solicitud de ingreso, Activo, Incidencias, Peligro

crea modelo y migraciones para associationMemberStatus:
id:autonumerico, pk
associationId: numérico, foreign key con associations, obligatorio
type smallInt, foreign key con associationMemberStatusType, obligatorio
order smallInt, obligatorio
name: string, obligatorio
description string
campos timestamp habituales
clave únicas adicionales: (associationId, name), 


