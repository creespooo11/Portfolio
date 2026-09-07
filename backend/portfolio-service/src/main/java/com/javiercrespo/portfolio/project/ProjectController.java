package com.javiercrespo.portfolio.project;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project create(@Valid @RequestBody Project project) {
        return repository.save(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @Valid @RequestBody Project update) {
        Project project = repository.findById(id).orElseThrow();
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
