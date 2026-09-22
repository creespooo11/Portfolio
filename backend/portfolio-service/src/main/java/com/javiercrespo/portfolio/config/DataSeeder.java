package com.javiercrespo.portfolio.config;

import com.javiercrespo.portfolio.experience.Experience;
import com.javiercrespo.portfolio.experience.ExperienceRepository;
import com.javiercrespo.portfolio.project.Project;
import com.javiercrespo.portfolio.project.ProjectRepository;
import com.javiercrespo.portfolio.skill.Skill;
import com.javiercrespo.portfolio.skill.SkillRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedPortfolio(ProjectRepository projects, SkillRepository skills, ExperienceRepository experience) {
        return args -> {
            if (projects.count() == 0) {
                projects.save(new Project(
                        "VitSync",
                        "Plataforma de gestion medica con historial, citas y chat en tiempo real. Desarrollada en equipo de 3, con el panel \"Mi Salud\" para pacientes.",
                        "https://github.com/Crespooo11",
                        "https://vitsync.es",
                        "vitsync.jpg",
                        1,
                        true));
                projects.save(new Project(
                        "PowerSupps",
                        "E-commerce de suplementos deportivos: WordPress, WooCommerce y Elementor, con SEO y automatizaciones n8n sincronizando pedidos con Miravia, Temu y TikTok Shop.",
                        "https://github.com/Crespooo11",
                        "https://powersupps.es",
                        "powersupps.jpg",
                        2,
                        true));
                projects.save(new Project(
                        "Portfolio",
                        "Este propio portfolio: arquitectura de microservicios real con Spring Boot, Vue 3, Kafka, PostgreSQL y MongoDB.",
                        "https://github.com/Crespooo11/Portfolio",
                        null,
                        "portfolio-placeholder.png",
                        3,
                        true));
            }

            if (skills.count() == 0) {
                skills.save(new Skill("Java", "Backend", 1));
                skills.save(new Skill("Spring Boot", "Backend", 2));
                skills.save(new Skill("Vue.js", "Frontend", 3));
                skills.save(new Skill("PostgreSQL", "Data", 4));
                skills.save(new Skill("Docker", "DevOps", 5));
                skills.save(new Skill("Kafka", "Messaging", 6));
            }

            if (experience.count() == 0) {
                experience.save(new Experience(
                        "Estudiante de Desarrollo de Aplicaciones Web",
                        "IES La Mola",
                        "Formacion especializada en desarrollo web fullstack, con el grado de DAM completado.",
                        "Actualidad",
                        1));
            }
        };
    }
}
