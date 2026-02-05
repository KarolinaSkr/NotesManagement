package com.notes.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(length = 1000)
    private String content;
    
    @Column(nullable = false)
    private Double positionX;
    
    @Column(nullable = false)
    private Double positionY;
    
    @Column
    private String color;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    public Note() {
        this.createdAt = LocalDateTime.now();
        this.color = "#fef3c7"; // Default yellow color
    }
    
    public Note(String title, String content, Double positionX, Double positionY) {
        this();
        this.title = title;
        this.content = content;
        this.positionX = positionX;
        this.positionY = positionY;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Double getPositionX() {
        return positionX;
    }
    
    public void setPositionX(Double positionX) {
        this.positionX = positionX;
    }
    
    public Double getPositionY() {
        return positionY;
    }
    
    public void setPositionY(Double positionY) {
        this.positionY = positionY;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
