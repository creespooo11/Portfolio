package com.javiercrespo.portfolio.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Public, read-only project API used by the frontend. Write operations live
 * in {@link ProjectAdminController}, which is disabled unless explicitly
 * enabled: there is no authentication, so they must never be reachable from
 * the internet.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository repository;

    public ProjectController(ProjectRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Project> findAll() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    @GetMapping("/{id}")
    public Project findById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }
}
