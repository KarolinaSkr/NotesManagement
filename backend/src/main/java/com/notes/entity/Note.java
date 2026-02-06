package com.notes.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


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
    
    @Column(name = "position_x", nullable = false)
    private Double positionX;
    
    @Column(name = "position_y", nullable = false)
    private Double positionY;

    
    @Column
    private String color;
    
    @ElementCollection
    @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag")
    private List<String> tags;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    
    public Note() {
        this.createdAt = LocalDateTime.now();
        this.color = "#fef3c7"; // Default yellow color
        this.tags = new ArrayList<>();
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
    
    public List<String> getTags() {
        return tags;
    }
    
    public void setTags(List<String> tags) {
        this.tags = tags;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
}
