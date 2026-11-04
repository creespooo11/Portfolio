package com.javiercrespo.portfolio.project;

import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Create / update / delete projects, for local administration only.
 * <p>
 * These endpoints have no authentication, so the controller only exists
 * when {@code PORTFOLIO_ADMIN_ENDPOINTS=true} is set (never in a deployed
 * environment). Off by default: the frontend only reads, and the data is
 * seeded by {@code DataSeeder}.
 */
@RestController
@RequestMapping("/api/projects")
@ConditionalOnProperty(name = "portfolio.admin-endpoints.enabled", havingValue = "true")
public class ProjectAdminController {

    private final ProjectRepository repository;

    public ProjectAdminController(ProjectRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project create(@Valid @RequestBody Project project) {
        return repository.save(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @Valid @RequestBody Project update) {
        Project project = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        project.setName(update.getName());
        project.setDescription(update.getDescription());
        project.setRepositoryUrl(update.getRepositoryUrl());
        project.setLiveUrl(update.getLiveUrl());
        project.setDisplayOrder(update.getDisplayOrder());
        project.setFeatured(update.isFeatured());
        return repository.save(project);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
