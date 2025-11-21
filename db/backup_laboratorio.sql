-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: laboratorio
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `instrumentos`
--

DROP TABLE IF EXISTS `instrumentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instrumentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `categoria` varchar(80) NOT NULL,
  `estado` enum('DISPONIBLE','PRESTADO','MANTENIMIENTO') DEFAULT 'DISPONIBLE',
  `ubicacion` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instrumentos`
--

LOCK TABLES `instrumentos` WRITE;
/*!40000 ALTER TABLE `instrumentos` DISABLE KEYS */;
INSERT INTO `instrumentos` VALUES (1,'Multimetro','Electricidad','PRESTADO','Laboratorio A'),(2,'Kit ECG','Biomédica','MANTENIMIENTO','Gabinete 3'),(3,'Pipetas','Quimica','PRESTADO','Laboratorio B'),(26,'Vidrios de reloj','Química','MANTENIMIENTO','Laboratorio 10'),(27,'Desfibrilador externo automático','Biomédica','DISPONIBLE','Laboratorio 31'),(28,'Portaobjetos','Química','DISPONIBLE','Laboratorio 22'),(29,'Monitor de signos vitales','Biomédica','DISPONIBLE','Laboratorio 31'),(30,'Osciloscopio','Electricidad','PRESTADO','Laboratorio 22'),(31,'Cautín','Electricidad','DISPONIBLE','Laboratorio A'),(32,'Fusibles','Electricidad','DISPONIBLE','Laboratorio 12'),(33,'Centrifugadora','Química','DISPONIBLE','Laboratorio 20'),(34,'Lancetas','Biomédica','DISPONIBLE','Laboratorio 31'),(35,'Tubos de ensayo','Química','DISPONIBLE','Laboratorio 8'),(36,'Guantes de latex','Química','DISPONIBLE','Laboratorio 20'),(37,'Pasta para soldar','Química','PRESTADO','Laboratorio A'),(38,'Equipo de rayos X portátil','Biomédica','DISPONIBLE','Laboratorio 22'),(39,'Fuente de poder','Electricidad','MANTENIMIENTO','Laboratorio B'),(40,'Generador de funciones','Electricidad','MANTENIMIENTO','Laboratorio 34'),(41,'Probeta','Química','PRESTADO','Laboratorio 20'),(42,'LCR meter','Electricidad','DISPONIBLE','Laboratorio A'),(43,'Multimetro','Electricidad','DISPONIBLE','Laboratorio A'),(44,'Kit ECG','Biomédica','MANTENIMIENTO','Gabinete 3'),(45,'Pipetas','Quimica','PRESTADO','Laboratorio B');
/*!40000 ALTER TABLE `instrumentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prestamos`
--

DROP TABLE IF EXISTS `prestamos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `instrumento_id` int NOT NULL,
  `usuario_correo` varchar(120) NOT NULL,
  `fecha_salida` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_regreso` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `instrumento_id` (`instrumento_id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`instrumento_id`) REFERENCES `instrumentos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prestamos`
--

LOCK TABLES `prestamos` WRITE;
/*!40000 ALTER TABLE `prestamos` DISABLE KEYS */;
/*!40000 ALTER TABLE `prestamos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('ADMIN','ASISTENTE','AUDITOR') NOT NULL DEFAULT 'ASISTENTE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Yami','admin@lab.com','$2b$10$G7DC8/PrUwi2pJjU6BwVZecu7Ofb6Nhto4UMQ9PiFrXyn4H4DAfhy','ADMIN'),(2,'Gabo','asistente@lab.com','$2b$10$5dxJF2IdIrHhTmn0zBQTpef.w153L14oEbVf3M0sB.DFBDOiTb5Tu','ASISTENTE'),(3,'Emmonuel','auditor@lab.com','$2b$10$X8BuDG79CTX29kDdLhQoC.NrdNWz08Vl/APvF3EZtVdN536DLISyy','AUDITOR'),(5,'Gustambo','asistente2@lab.com','$2b$10$5rpko58bhJASKjJx/X0GcOB8CehWzDqtHlzRd2iG2yqn1DHd4NskK','ASISTENTE'),(6,'Chris Jedi','morenito@lab.com','$2b$10$BpNUc8aXWvRzDAyC5Mg7jOsSRcIJviAW9L.SOL6ZcC7VR7iitAcdy','ADMIN'),(9,'Diegussy','labaccount@lab.com','$2b$10$ldEY0mqPgvlE5ifHvNd16Onos6x2f9y.lGMqDDoOPITAt5ODDa90.','ADMIN');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-20 16:53:26
