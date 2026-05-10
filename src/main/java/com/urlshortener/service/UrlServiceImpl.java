package com.urlshortener.service;

import com.urlshortener.model.Url;
import com.urlshortener.repository.UrlRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UrlServiceImpl implements UrlService {

    private final UrlRepository urlRepository;
    
    // The characters used for Base62 encoding (a-z, A-Z, 0-9)
    private static final String BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    @Autowired
    public UrlServiceImpl(UrlRepository urlRepository) {
        this.urlRepository = urlRepository;
    }

    @Override
    @Transactional
    public Url shortenUrl(String originalUrl) {
        // Check if URL already exists in our database
        Optional<Url> existingUrl = urlRepository.findByOriginalUrl(originalUrl);
        if (existingUrl.isPresent()) {
            return existingUrl.get();
        }

        // --- Beginner Friendly Base62 Encoding Approach ---
        // Instead of a database ID which requires saving twice, we use the current 
        // time in milliseconds as our Base10 number. It's unique across time and 
        // easily converts into a clean ~7 character short code.
        long uniqueId = System.currentTimeMillis();
        String shortCode = encodeBase62(uniqueId);
        
        // In the extremely rare case of a collision (multiple requests in the exact 
        // same millisecond), we simply increment the ID and encode again.
        while (urlRepository.findByShortCode(shortCode).isPresent()) {
            uniqueId++;
            shortCode = encodeBase62(uniqueId);
        }

        Url newUrl = new Url(originalUrl, shortCode);
        return urlRepository.save(newUrl);
    }

    @Override
    @Transactional
    public Url getOriginalUrl(String shortCode) {
        Optional<Url> urlOpt = urlRepository.findByShortCode(shortCode);
        if (urlOpt.isPresent()) {
            Url url = urlOpt.get();
            // Increment the click count whenever the short code is accessed
            url.setClickCount(url.getClickCount() + 1);
            urlRepository.save(url);
            return url;
        }
        throw new RuntimeException("URL not found for short code: " + shortCode);
    }

    @Override
    public List<Url> getRecentUrls() {
        return urlRepository.findTop10ByOrderByCreatedAtDesc();
    }

    /**
     * Converts a Base10 number into a Base62 string.
     * 
     * How it works (Interview Explanation):
     * 1. We repeatedly divide the number by 62 (the size of our character set).
     * 2. The remainder points to a specific character in the BASE62 string.
     * 3. We append that character and continue until the number reaches 0.
     * 4. Finally, we reverse the string because we extracted the least significant digits first.
     */
    private String encodeBase62(long value) {
        if (value == 0) {
            return String.valueOf(BASE62.charAt(0));
        }
        
        StringBuilder sb = new StringBuilder();
        while (value > 0) {
            int remainder = (int) (value % 62);
            sb.append(BASE62.charAt(remainder));
            value /= 62;
        }
        
        return sb.reverse().toString();
    }
}
