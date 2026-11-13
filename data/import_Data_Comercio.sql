CREATE DATABASE IF NOT EXISTS comercio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE comercio;

CREATE TABLE IF NOT EXISTS data_comercio (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sociedad VARCHAR(120),
  actualizacion VARCHAR(20),
  cuenta VARCHAR(30),
  nombre VARCHAR(160),
  clienteId VARCHAR(40),
  nombreAcreedorCliente VARCHAR(255),
  nit VARCHAR(30),
  nombreMaterial VARCHAR(255),
  jerarquia VARCHAR(80),
  asignacion VARCHAR(80),
  direccion VARCHAR(255),
  telefono VARCHAR(40),
  correo VARCHAR(255),
  PRIMARY KEY (id),
  INDEX idx_nit (nit),
  INDEX idx_cliente (clienteId),
  INDEX idx_correo (correo)
) ENGINE=InnoDB;

LOAD XML LOCAL INFILE 'C:/Users/GAMER/Proyecto-Prueba-Laboral-main/data/Data_Comercio.xml'
INTO TABLE data_comercio
CHARACTER SET utf8mb4
ROWS IDENTIFIED BY '<registro>';

SELECT COUNT(*) AS total_importado FROM data_comercio;
SELECT * FROM data_comercio LIMIT 10;
