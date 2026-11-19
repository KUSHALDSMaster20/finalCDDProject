package edu.campuscommons;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApiConfig implements WebMvcConfigurer {
<<<<<<< HEAD
    @Value("${app.cors.origin}") private String origins;
    @Override public void addCorsMappings(CorsRegistry registry) {
        String[] allowed=java.util.Arrays.stream(origins.split(",")).map(String::trim).filter(s->!s.isEmpty()).toArray(String[]::new);
        registry.addMapping("/api/**").allowedOriginPatterns(allowed).allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS").allowedHeaders("*");
=======
    @Value("${app.cors.origin}") private String origin;
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origin).allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS").allowedHeaders("*");
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615
    }
}
