package com.urlshortener.service;

import com.urlshortener.model.Url;
import java.util.List;

public interface UrlService {
    Url shortenUrl(String originalUrl);
    Url getOriginalUrl(String shortCode);
    List<Url> getRecentUrls();
}
