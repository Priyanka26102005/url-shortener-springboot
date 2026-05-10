package com.urlshortener.controller;

import com.urlshortener.model.Url;
import com.urlshortener.service.UrlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class RedirectController {

    private final UrlService urlService;

    @Autowired
    public RedirectController(UrlService urlService) {
        this.urlService = urlService;
    }

    @GetMapping("/{shortCode:[a-zA-Z0-9]+}")
    public Object redirectUrl(@PathVariable String shortCode) {
        // Prevent intercepting standard Spring Boot paths which causes infinite redirect loops
        if ("error".equals(shortCode) || "api".equals(shortCode)) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }

        try {
            Url url = urlService.getOriginalUrl(shortCode);
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl(url.getOriginalUrl());
            return redirectView;
        } catch (RuntimeException e) {
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl("/?error=notfound");
            return redirectView;
        }
    }
}
