package com.javiercrespo.portfolio.project;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the imageUrl field added to Project for the frontend redesign
 * (hover-reveal project previews): every project returned by the API must
 * carry it, and the seeded projects must point at the expected assets.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listProjectsIncludesImageUrlForEverySeededProject() throws Exception {
        String json = mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode projects = objectMapper.readTree(json);
        assertThat(projects.isArray()).isTrue();
        assertThat(projects).isNotEmpty();

        Map<String, String> imageUrlsByName = new HashMap<>();
        for (JsonNode project : projects) {
            assertThat(project.hasNonNull("imageUrl"))
                    .as("project '%s' should have a non-null imageUrl", project.path("name").asText())
                    .isTrue();
            imageUrlsByName.put(project.path("name").asText(), project.path("imageUrl").asText());
        }

        assertThat(imageUrlsByName)
                .containsEntry("VitSync", "vitsync.webp")
                .containsEntry("PowerSupps", "powersupps.webp")
                .containsEntry("Portfolio", "portfolio-placeholder.webp");
    }
}
