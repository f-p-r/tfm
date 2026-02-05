Crea modelo, migración y tabla para userAssociation:
id: autonumérico, pk
userID: FK con users 
associationID: FK con associations,
associationUserID: string, nullable
joinedAt: date, nullable
claves únicas: (userID, associationID), (associationID, associationUserID)
timestamps

Crea api crud y documentala en docs/api con misma estructura que los existentes
