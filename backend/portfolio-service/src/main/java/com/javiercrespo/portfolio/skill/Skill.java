package com.javiercrespo.portfolio.skill;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 80)
    private String name;

    @NotBlank
    @Size(max = 40)
    private String category;

    @NotNull
    private Integer displayOrder;

    protected Skill() {
    }

    public Skill(String name, String category, Integer displayOrder) {
        this.name = name;
        this.category = category;
        this.displayOrder = displayOrder;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public Integer getDisplayOrder() { return displayOrder; }
}
