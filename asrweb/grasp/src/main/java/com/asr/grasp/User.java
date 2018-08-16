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

    @Column(name = "email")
    private String email;

    @Column(name = "confirmation_token")
    private String confirmationToken;

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

    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the username of the user.
     * @return username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Sets the username. This is must be unique.
     * @param username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Gets the users password from the database
     * @return hashed password
     */
    public String getPassword() {
        return this.password;
    }

    /**
     * Sets a users password in the database.
     * The password has already been hashed.
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Sets the secondary password. This is only used in the registration of
     * a new user. Once it has been validated that the two passwords are the
     * same this is no longer stored.
     * @param password
     */
    public void setPasswordMatch(String password) {
        this.passwordMatch = password;
    }

    /**
     * ToDo: Check that the email is correctly formatted.
     * @param email
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * ToDo: Implement this.
     * @param confirmationToken
     */
    public void setConfirmationToken(String confirmationToken) {
       this.confirmationToken = confirmationToken;
    }

    /**
     *
     * @param email
     */
    public String getEmail() {
        return this.email;
    }

    /**
     * ToDo: Implement this.
     * @param confirmationToken
     */
    public String getConfirmationToken() {
        return this.confirmationToken;
    }

    /**
     * Gets the temporary password match. This is taken from the users form.
     * @return hashed password
     */
    public String getPasswordMatch() {
        return this.passwordMatch;
    }

    public Set<Reconstruction> getAllReconstructions() {
        return this.reconstructions;
    }

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

    public void setReconstructions(Set<Reconstruction> reconstructions) {
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
        reconstructions.remove(reconstruction);
        reconstruction.removeUser(this);
    }

    public void removeReconstruction(Reconstruction reconstruction) {
        reconstructions.remove(reconstruction);
        reconstruction.removeUser(this);
    }
}
