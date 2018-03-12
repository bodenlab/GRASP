package com.asr.grasp;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity(name = "User")
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Transient
    private String passwordMatch;

    @ManyToMany(cascade = {
            CascadeType.PERSIST,
            CascadeType.MERGE
    })
    @JoinTable(name = "User_Recon",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "recon_id")
    )
    private Set<Reconstruction> reconstructions = new HashSet<>();

    @Column(name = "shared")
    @ElementCollection(fetch = FetchType.EAGER)
    private Set<Long> sharedReconstructionIDs = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id){
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword(){
        return this.password;
    }

    public void setPassword(String password){
        this.password = password;
    }

    @Transient
    public String getPasswordMatch() {
        return this.passwordMatch;
    }

    public void setPasswordMatch(String passwordMatch){
        this.passwordMatch = passwordMatch;
    }

    public Set<Reconstruction> getAllReconstructions() { return this.reconstructions; }

    public Set<Reconstruction> getNonSharedReconstructions() {
        Set<Reconstruction> recons = new HashSet<>();
        for (Reconstruction r : this.reconstructions)
            if (!sharedReconstructionIDs.contains(r.getId()))
                recons.add(r);
        return recons;
    }

    public Set<Long> getSharedReconstructions() {
        return this.sharedReconstructionIDs;
    }

    public void setReconstructions(Set<Reconstruction> reconstructions){
        this.reconstructions = reconstructions;
    }

    public void addReconstruction(Reconstruction reconstruction) {
        if (!reconstructions.contains(reconstruction))
            reconstructions.add(reconstruction);
        reconstruction.addUser(this);
    }

    public void addSharedReconstruction(Reconstruction reconstruction) {
        if (!sharedReconstructionIDs.contains(reconstruction.getId()))
            sharedReconstructionIDs.add(reconstruction.getId());
        reconstruction.addUser(this);
    }

    public void removeSharedReconstruction(Reconstruction reconstruction) {
        sharedReconstructionIDs.remove(reconstruction.getId());
        reconstruction.removeUser(this);
    }

    public void removeReconstruction(Reconstruction reconstruction) {
        reconstructions.remove(reconstruction);
        reconstruction.removeUser(this);
    }
}
