package com.urlshortener.controller;

import com.urlshortener.model.Url;
import com.urlshortener.service.UrlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/urls")
public class UrlApiController {

    private final UrlService urlService;

    @Autowired
    public UrlApiController(UrlService urlService) {
        this.urlService = urlService;
    }

    @PostMapping("/shorten")
    public ResponseEntity<?> shortenUrl(@RequestBody Map<String, String> request) {
        String originalUrl = request.get("originalUrl");
        
        if (originalUrl == null || originalUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL cannot be empty"));
        }
        
        // Validate URL format
        try {
            new URL(originalUrl);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid URL format. Must include http:// or https://"));
        }

        try {
            Url savedUrl = urlService.shortenUrl(originalUrl);
            return ResponseEntity.ok(savedUrl);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "An error occurred while shortening the URL"));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Url>> getRecentUrls() {
        return ResponseEntity.ok(urlService.getRecentUrls());
    }
}
