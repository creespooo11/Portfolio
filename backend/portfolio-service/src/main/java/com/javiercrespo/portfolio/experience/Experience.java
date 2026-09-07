package com.javiercrespo.portfolio.experience;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "experiences")
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    private String role;

    @NotBlank
    @Size(max = 120)
    private String company;

    @NotBlank
    @Size(max = 500)
    private String summary;

    @NotBlank
    @Size(max = 20)
    private String period;

    @NotNull
    private Integer displayOrder;

    protected Experience() {
    }

    public Experience(String role, String company, String summary, String period, Integer displayOrder) {
        this.role = role;
        this.company = company;
        this.summary = summary;
        this.period = period;
        this.displayOrder = displayOrder;
    }

    public Long getId() { return id; }
    public String getRole() { return role; }
    public String getCompany() { return company; }
    public String getSummary() { return summary; }
    public String getPeriod() { return period; }
    public Integer getDisplayOrder() { return displayOrder; }
}
