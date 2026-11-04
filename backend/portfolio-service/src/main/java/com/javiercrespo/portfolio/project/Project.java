package com.javiercrespo.portfolio.project;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Size(max = 500)
    private String description;

    // Links are rendered as <a href> in the frontend: only http(s) URLs, so a
    // javascript: or data: URL can never be stored and executed on click.
    @NotBlank
    @Size(max = 500)
    @Pattern(regexp = "^https?://[^\\s]+$", message = "Must be an http(s) URL")
    private String repositoryUrl;

    @Size(max = 500)
    @Pattern(regexp = "^https?://[^\\s]+$", message = "Must be an http(s) URL")
    private String liveUrl;

    // A file name inside the frontend's assets folder, never a path or URL.
    @Size(max = 300)
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "Must be a plain file name")
    private String imageUrl;

    @NotNull
    private Integer displayOrder;

    private boolean featured;

    protected Project() {
    }

    public Project(String name, String description, String repositoryUrl, String liveUrl, Integer displayOrder, boolean featured) {
        this(name, description, repositoryUrl, liveUrl, null, displayOrder, featured);
    }

    public Project(String name, String description, String repositoryUrl, String liveUrl, String imageUrl, Integer displayOrder, boolean featured) {
        this.name = name;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.liveUrl = liveUrl;
        this.imageUrl = imageUrl;
        this.displayOrder = displayOrder;
        this.featured = featured;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRepositoryUrl() { return repositoryUrl; }
    public void setRepositoryUrl(String repositoryUrl) { this.repositoryUrl = repositoryUrl; }
    public String getLiveUrl() { return liveUrl; }
    public void setLiveUrl(String liveUrl) { this.liveUrl = liveUrl; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
}
