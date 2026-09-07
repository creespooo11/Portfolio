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
                        "Portfolio fullstack con microservicios",
                        "Portfolio profesional con Vue, Spring Boot, PostgreSQL, MongoDB y eventos Kafka.",
                        "https://github.com/Crespooo11/Portfolio",
                        null,
                        1,
                        true));
                projects.save(new Project(
                        "Aplicaciones Java para gestión",
                        "Aplicaciones desarrolladas durante la formación DAM con foco en diseño y persistencia.",
                        "https://github.com/Crespooo11",
                        null,
                        2,
                        false));
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
