package com.asr.grasp;

import com.asr.grasp.controller.ConsensusController;
import com.asr.grasp.controller.EmailController;
import com.asr.grasp.controller.SaveController;
import com.asr.grasp.controller.SeqController;
import com.asr.grasp.controller.TaxaController;
import com.asr.grasp.controller.TreeController;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.objects.ConsensusObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.objects.ShareObject;
import com.asr.grasp.utils.Defines;
import com.asr.grasp.utils.NaturalOrderComparator;
import com.asr.grasp.validator.LoginValidator;
import com.asr.grasp.validator.UserValidator;
import com.asr.grasp.view.AccountView;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Collections;

import java.util.HashMap;
import json.JSONArray;
import json.JSONObject;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.annotation.SessionScope;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.ModelAndView;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.beans.factory.annotation.Value;


@Controller
@SpringBootApplication
@SessionScope
public class GraspApplication extends SpringBootServletInitializer {

    @Value("${project.sessionPath}")
    private String sessionPath;

    private final static Logger logger = Logger.getLogger(GraspApplication.class.getName());

    private ASRThread recon = null;

    private boolean runningMarginal = false;

    @Autowired
    private UserValidator userValidator;

    @Autowired
    private AccountView accountView;

    @Autowired
    private LoginValidator loginValidator;

    @Autowired
    private UserController userController;

    @Autowired
    private ReconstructionController reconController;

    @Autowired
    private TaxaController taxaController;

    @Autowired
    private SeqController seqController;

    @Autowired
    private EmailController emailController;

    private SaveController saveController = null;

    @Autowired
    private TreeController treeController;

    @Autowired
    private ConsensusController consensusController;

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(GraspApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(GraspApplication.class, args);
    }

    private UserObject loggedInUser = new UserObject();

    private ReconstructionObject currRecon = new ReconstructionObject();

    /**
     * ToDo: Will need to look into this as holding two instances for large recons won't work. HOWEVER, we shouldn't
     * be looking to do this for large reconstructions anyway- the user should be saving them first which would
     * mitigate these issues.
     */
    private ASRObject asr = new ASRObject();
    private ASRObject marginalAsr = new ASRObject();


    private boolean saveGappySeq = true;

    // A flag that keeps track of whether a reconstruction is currently being saved.
    private boolean isSaving = false;

    // Inputted email of the user - might be before they login
    private String email;

    // Keep track of the currently selected reconstructed nodes so that we can easily let the user
    // save them.
    private ArrayList<JSONObject> reconstructedNodes;

    // Again for downloading
    private JSONObject ancestor;
    private JSONObject msa;

    private boolean needToSave = false;

    @RequestMapping(value = "/register", method = RequestMethod.GET)
    public ModelAndView showRegistrationForm(WebRequest request, Model model) {
        model.addAttribute("user", loggedInUser);
        return new ModelAndView("register");
    }

    /**
     * This is actually to logout. Here we want to reset the loggedInUser and also the current
     * reconstruction and ASR.
     */
    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public ModelAndView showLoginForm(WebRequest request, Model model) {
        // Reset our variables.
        loggedInUser = new UserObject();

        if (!needToSave) {
            currRecon = new ReconstructionObject();
            asr = new ASRObject();
        } else {
            needToSave = false;
        }

        model.addAttribute("user", loggedInUser);
        model.addAttribute("username", null);
        needToSave = false;
        return new ModelAndView("login");
    }

    @RequestMapping(value = "/account", method = RequestMethod.GET)
    public ModelAndView showAccount(WebRequest request, Model model) {
        // ToDo: Check the obsolete recons
        //reconController.checkObsolete();
        return accountView.get(loggedInUser, userController);
    }

    /**
     * Initialise the initial form in the index
     *
     * @return index html
     */
    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ModelAndView showForm(Model model) {
        this.asr = new ASRObject();
        model.addAttribute("asrForm", this.asr);
        model.addAttribute("username", loggedInUser.getUsername());
        return new ModelAndView("index");
    }


    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"cancel"})
    public ModelAndView cancelRecon(WebRequest request, Model model) {
        if (recon != null) {
            recon.interrupt();
        }
        // Ensure we don't think any jobs are still running.
        runningMarginal = false;

        if (asr.performedRecon()) {
            return returnASR(model);
        }

        return showForm(model);

    }

    /**
     * ToDo need to change to int reconId from long id. Deletes a reconstruction
     *
     * @return the view for the account page.
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params =
            {"delete", "id"})
    public ModelAndView deleteRecon(@RequestParam("delete") String delete,
            @RequestParam("id") int reconId, WebRequest
            webrequest, Model model) {

        ModelAndView mav = accountView.get(loggedInUser, userController);
        // Need to check if the users details were correct
        String err = reconController.delete(reconId, loggedInUser);

        if (err != null) {
            mav.addObject("warning", err);
        } else {
            mav.addObject("type", "deleted");
            mav.addObject("warning", null);
        }

        return mav;
    }

    /**
     * Shares the reconsrtruction with another user by their username.
     *
     * ToDo: Need to look at what the shareObject was
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, params = {"share"})
    public ModelAndView shareRecon(@RequestParam("share") String share,
            @ModelAttribute("share") ShareObject shareObject,
            BindingResult bindingResult, Model model, HttpServletRequest request) {
        ModelAndView mav = accountView.get(loggedInUser, userController);
        // ShareObject it with the user
        String err = reconController.shareWithUser(shareObject.getReconID(),
                shareObject.getUsername(), loggedInUser);

        if (err != null) {
            mav.addObject("warning", err);
        } else {
            mav.addObject("type", "shared");
            mav.addObject("warning", null);
        }

        return mav;
    }

    /**
     * Loads a reconstruction based on the ID. ID is the reconstruction ID.
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"load", "id"})
    public ModelAndView loadRecon(@RequestParam("load") String load,
            @RequestParam("id") int id, WebRequest
            webrequest, Model model) {

        // Here since we store the current reconsruction we just need to
        // update the reconstruction that it is pointing at.

        ReconstructionObject recon = reconController.getById(id,
                loggedInUser);
        // We want to return that the reconstruction doesn't exist if it
        // isn't in the db or the user doesn't have access
        if (recon == null) {
            return showError(model);
        }

        // Otherwise we want to set this for the user.
        userController.setCurrRecon(recon, loggedInUser);

        currRecon = loggedInUser.getCurrRecon();

        ModelAndView mav = new ModelAndView("index");

        mav.addObject("label", currRecon.getLabel());

        // add reconstructed newick string to send to javascript
        mav.addObject("tree", currRecon.getReconTree());

        // add msa and inferred ancestral graph
        String graphs = asr.catGraphJSONBuilder(new JSONObject(currRecon.getMsa()), new JSONObject(recon.getAncestor()));

        mav.addObject("graph", graphs);

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        mav.addObject("inferenceType", recon.getInferenceType());
        mav.addObject("node", recon.getNode());
        mav.addObject("results", true);

        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        // Run reconstruction but first get the extent names so we can asynronously do a lookup with
        // NCBI to get the taxonomic iDs.
        // ToDo: add in the IDs
        JSONObject ids = taxaController.getNonExistIdsFromProtId(seqController.getSeqLabelAsNamedMap(currRecon.getId()));

        mav.addObject("ids", ids.toString());
        mav.addObject("saved", true);

        mav.addObject("jointLabels", seqController.getAllSeqLabels(currRecon.getId(), Defines.JOINT));
        // Add the ancestor to the list we don't need to check here for duplicates as this will be
        // the initial iteration.
        reconstructedNodes = new ArrayList<>();
        msa = new JSONObject(currRecon.getMsa());
        ancestor = new JSONObject(recon.getAncestor());

        return mav;
    }


    /**
     * Save the current reconstruction if there is a current reconstruction.
     *
     * This is called when a user registers (i.e. they may have just made a reconstruction) or logs
     * in.
     */
    public void saveCurrReconStartThread() {
        saveController = new SaveController(reconController, currRecon, userController, loggedInUser, emailController, seqController, treeController, saveGappySeq, true);
        saveController.initialiseForReconstruction(asr);
        saveController.start();
    }


    /**
     * Save the current reconstruction if there is a current reconstruction.
     *
     * This is called when a user registers (i.e. they may have just made a reconstruction) or logs
     * in.
     */
    public String saveCurrRecon() {
        // The user may have just logged in so we need to update the
        // owner id
        currRecon.setOwnerId(loggedInUser.getId());

        String err = null;
        if (email != null) {
            saveCurrReconStartThread();
        } else {
            // Save the reconstruction
            err = reconController.save(loggedInUser, currRecon);

            // We also want to save all joint recons
            seqController.insertAllJointsToDb(currRecon.getId(), asr.getASRPOG(Defines.JOINT),
                    saveGappySeq, loggedInUser.getId());

            // Also want to save all the extents into the db
            seqController.insertAllExtantsToDb(currRecon.getId(), asr.getSequencesAsNamedMap(),
                    saveGappySeq);

        }
        return err;
    }

    /**
     * Logs in the user and takes them to their account page.
     */
    @RequestMapping(value = "/login", method = RequestMethod.POST)
    public ModelAndView loginUser(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {

        loginValidator.validate(user, bindingResult);

        // If we have passed the validation this means that the username and
        // password are correct.
        String err = userController.loginUser(user);
        if (err != null) {
            bindingResult.rejectValue("username", err);
        }
        if (bindingResult.hasErrors()) {
            return new ModelAndView("login");
        }

        loggedInUser = user;

        // ToDo: check the obsolete recons
        //reconController.checkObsolete();

        String errSave = null;
        Boolean saved = false;
        // If there is a current reconstruction save it.
        if (currRecon.getLabel() != null) {
            // Assume they input their email when they selected to save it.
            if (email != null) {
                loggedInUser.setEmail(email);
            } else {
                // ToDo: Fix this to ask for an email again.
                loggedInUser.setEmail("noemail");
            }
            errSave = saveCurrRecon();
            email = null;
            saved = true;
        }

        // Get their accounts page after we have saved the reconstruction (if
        // one existed).
        ModelAndView mav = accountView.get(loggedInUser, userController);

        // CHeck that err wasn't try
        if (errSave != null) {
            mav.addObject("warning", errSave);
        } else {
            mav.addObject("warning", null);
        }
        if (errSave == null && saved == true) {
            mav.addObject("type", "saved");
        }
        saveController = new SaveController();
        return mav;
    }

    /**
     * Registers a new user account and sends the user to the accounts page.
     */
    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public ModelAndView registerUser(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {

        userValidator.validate(user, bindingResult);

        if (bindingResult.hasErrors()) {
            return new ModelAndView("register");
        }

        String err = userController.register(user);

        if (err != null) {
            // Probably should add an error here
            return new ModelAndView("register");
        }
        // Otherwise we want to get the now logged in user by ID
        userController.getId(user);

        // Set the loggedInUser
        loggedInUser = user;

        Boolean saved = false;
        String errSave = null;
        // If there is a current reconstruction save it.
        if (currRecon.getLabel() != null) {
            errSave = saveCurrRecon();
            saved = true;
        }

        // Get their accounts page after we have saved the reconstruction (if
        // one existed).
        ModelAndView mav = accountView.get(loggedInUser, userController);

        // CHeck that err wasn't try
        if (err != null || errSave != null) {
            mav.addObject("warning", err.toString() + errSave.toString());
        } else {
            mav.addObject("warning", null);
        }
        if (errSave == null && saved == true) {
            mav.addObject("type", "saved");
        }
        return mav;
    }

//	/**
//	 * ToDo: Implememnt send registration email. This will enable users to
//	 * reset passwords etc.
//	 * @param registered
//	 * @return
//	 */
//	private User sendRegistrationEmail(User registered, HttpServletRequest request) {
//		// Disable user until they click on confirmation link in email
//		// registered.setEnabled(false);
//
//		// Generate random 36-character string token for confirmation link
//		registered.setConfirmationToken(UUID.randomUUID().toString());
//
//		String appUrl = request.getScheme() + "://" + request.getServerName();
//
//		SimpleMailMessage registrationEmail = new SimpleMailMessage();
//		registrationEmail.setTo(registered.getEmail());
//		registrationEmail.setSubject("Registration Confirmation");
//		registrationEmail.setText("To confirm your e-mail address, please click the link below:\n"
//				+ appUrl + "/confirm?token=" + registered.getConfirmationToken());
//		registrationEmail.setFrom("noreply@domain.com");
//
//		emailService.sendEmail(registrationEmail);
//		return registered;
//	}
//
//	private com.asr.grasp.User createUserAccount(com.asr.grasp.User user){
//		return controller.registerNewUserAccount(user);
//	}
//
//	private com.asr.grasp.User getUserAccount(com.asr.grasp.User user){
//		return controller.getUserAccount(user);
//	}

    /**
     * Show guide
     *
     * @return guide html
     */
    @RequestMapping(value = "/guide", method = RequestMethod.GET)
    public ModelAndView showGuide(Model model) {
        ModelAndView mav = new ModelAndView("guide");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }

    /**
     * Show workshop tutorial
     *
     * @return guide html
     */
    @RequestMapping(value = "/tutorial", method = RequestMethod.GET)
    public ModelAndView showTutorial(Model model) {
        ModelAndView mav = new ModelAndView("tutorial");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }

    /**
     * Show max likelihood info
     *
     * @return guide html
     */
    @RequestMapping(value = "/ml", method = RequestMethod.GET)
    public ModelAndView showMlInfo(Model model) {
        ModelAndView mav = new ModelAndView("ml");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Save reconstruction
     *
     * @return account html
     */
    @RequestMapping(value = "/save", method = RequestMethod.GET)
    public ModelAndView saveRecon(WebRequest request, Model model) throws IOException {
        // Saves the current reconstruction

        // if a user is not logged in, prompt to Login
        if (loggedInUser.getUsername() == null || loggedInUser.getUsername() == "") {
            ModelAndView mav = new ModelAndView("login");
            mav.addObject("user", loggedInUser);
            return mav;
        }

        // Save the reconstruction
        String err = saveCurrRecon();

        // Check if we were able to save it
        if (err != null) {
            // ToDo: Something
            return showError(model);
        }
        ModelAndView mav = accountView.get(loggedInUser, userController);

        mav.addObject("type", "saved");
        return mav;
    }

    /**
     * Show error
     *
     * @return index html
     */
    @RequestMapping(value = "/error", method = RequestMethod.GET)
    public ModelAndView showError(Model model) {
        ModelAndView mav = new ModelAndView("index");
        mav.addObject("asrForm", asr);
        mav.addObject("error", true);
        mav.addObject("errorMessage",
                "Sorry! An unknown error occurred. Please check the error types in the guide and retry your reconstruction... ");
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Allows us to keep the marginal and the joint reconstruction separate.
     * @param status
     * @param asr
     * @return
     */
    public String getStatusFromAsr(String status, ASRObject asr) {
        try {
            if (status != null && (status.equalsIgnoreCase("done") || status.contains("error"))) {
                String stat = status;
                asr.setFirstPass(true); // reset flag
                asr.setPrevProgress(0);
                return stat;
            }

            // try to get current node ID
            int progress = asr.getNumberAlnCols() == 0 ? 0
                    : (100 * asr.getReconCurrentNodeId()) / asr.getNumberAlnCols();
            if (asr.getFirstPass() && progress < asr.getPrevProgress()) {
                asr.setFirstPass(false);
            }

            progress = asr.getFirstPass() ? progress / 2 : 50 + progress / 2;
            if (progress > asr.getPrevProgress()) {
                asr.setPrevProgress(progress);
            }

            return asr.getPrevProgress() + "%";
        } catch (Exception e) {
            System.out.println(e);
            return "";
        }
    }


    /**
     * Show status of reconstruction while asynchronously performing analysis
     *
     * @return status of reconstruction
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"request"})
    public @ResponseBody
    String showStatus(@RequestParam("request") String request, Model model) throws Exception {

        String status = recon.getStatus();
        if (runningMarginal) {
            return getStatusFromAsr(status, marginalAsr);
        }
        return getStatusFromAsr(status, asr);

    }


    /**
     * Gets the taxonomic ids from the User side.
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/taxa" , method = RequestMethod.POST)
    public @ResponseBody String getTaxaInfo(@RequestBody String jsonString) {
        String err = verify();

        if (err != null) {
            return err;
        }

        JSONObject dataJson = new JSONObject(jsonString);
        // Check if we have anything to save
        if ((Boolean)dataJson.get("toSave") == true) {
            err = taxaController.insertTaxaIds(dataJson);
        }

        // Now we want to get the taxonomic information for all the IDs in this dataset.
        // ToDo: could be slightly optimised to use the IDs collected before.
        return taxaController.getTaxaInfoFromProtIds(seqController.getSeqLabelAsNamedMap(currRecon.getId())).toString();
    }

    /**
     * Gets a joint reconstruction to add to the recon graph.
     *
     * Returns a JSON string representation of the consensus sequence
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/getrecon" , method = RequestMethod.POST)
    public @ResponseBody String getRecon(@RequestBody String jsonString) {

        JSONObject dataJson = new JSONObject(jsonString);
        // Check if we have anything to save
        int reconMethod = Defines.JOINT;
        if ((Boolean)dataJson.get("joint") != true) {
            reconMethod = Defines.MARGINAL;
        }
        if (dataJson.getString("nodeLabel").equals(null)) {
            return "You need to have a label.";
        }
        String nodeLabel = dataJson.getString("nodeLabel");

        // Return the reconstruction as JSON (note if we don't have it we need to create the recon)
        String reconstructedAnsc = seqController.getInfAsJson(currRecon.getId(), nodeLabel);

        if (reconstructedAnsc == null) {
            // This means we weren't able to find it in the DB so we need to run the recon as usual
            JSONObject ancestor = asr.getAncestralGraphJSON(dataJson.getString("nodeLabel"));
            reconstructedNodes.add(ancestor);
            return ancestor.toString();
        }

        // Here we want to update the one in the database so that we don't have to re-do this do for
        //return c.getAsJson().toString();

        // Add to the reconstructed ancestors for saving
        reconstructedNodes.add(new JSONObject(reconstructedAnsc));

        return reconstructedAnsc;
    }

    /**
     * A helper method that facilitates in the verification process.
     *
     * @return
     */
    private String verify() {
        // If there is no user logged in return that they need to log in and save a recon before
        // performing motif searching.
        if (loggedInUser == null) {
            return new JSONObject().put("error", "User must be logged in to perform this action.").toString();
        }
        // If they don't have a saved reconstruction return that they need to save the reconstruction
        if (currRecon.getId() == Defines.FALSE) {
            return new JSONObject().put("error", "You need to save your reconstruction before performing this action.").toString();
        }
        // If their reconstruction is of old format then we want to tell them to re-perform the reconstruction
        if (!seqController.hasReconsAncestorsBeenSaved(currRecon.getId())) {
            return new JSONObject().put("error", "Apologies but you need to re-run your reconstruction as we've made a lot of changes to make this feature possible! Please re-run it (and save your reconstruction) and then this will be possible. Also please delete your old reconstruction so we have more space in our database, thank you :) ").toString();
        }
        return null;
    }

    /**
     * Checks if the reconstruction can be saved. Also checks if the user is currently saving a
     * recon, if they are then return that they have to wait until the other reconstruction
     * has been saved.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/saveRecon" , method = RequestMethod.POST)
    public @ResponseBody String saveCurrentRecon(@RequestBody String jsonString) {
        JSONObject dataJson = new JSONObject(jsonString);

        JSONObject returnVal = new JSONObject();
        /**
         * Only allow one reconstruction to be saved at a time.
         * ToDo: Batch these
         */
        if (saveController != null) {
            isSaving = saveController.getIsSaving();
        } else {
            isSaving = false;
        }
        if (isSaving) {
            return returnVal.put("value", "isSaving").toString();
        }
        email = dataJson.getString("email");


        // if a user is not logged in, prompt to Login
        if (loggedInUser.getUsername() == null || loggedInUser.getUsername().equals("")) {
            needToSave = true;
            return returnVal.put("value", "login").toString();
        }

        loggedInUser.setEmail(email);
        saveCurrReconStartThread();

        isSaving = true;
        return returnVal.toString();
    }


    /**
     * Gets the node ids that contain a certain motif. This updates the tree.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/motif" , method = RequestMethod.POST)
    public @ResponseBody String getAncestorsMatchingMotif(@RequestBody String jsonString) {

        String err = verify();
        if (err != null) {
            return err;
        }
        // Otherwise we're able to run it
        JSONObject dataJson = new JSONObject(jsonString);

        // Check for the motif
        String motif = dataJson.getString("motif");

        //Return the list of matching node ids as a json array
        return seqController
                .findAllWithMotifJSON(reconController.getUsersAccess(currRecon.getId(), loggedInUser), currRecon.getId(), motif).toString();
    }


    /**
     * Gets similar nodes between two reconstructed trees that a user has access to.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/getsimilarnode" , method = RequestMethod.POST)
    public @ResponseBody String getSimilarNodes(@RequestBody String jsonString) {
        String err = verify();
        if (err != null) {
            return err;
        }
        // Otherwise we're able to run it
        JSONObject data = new JSONObject(jsonString);


        if (data.getString("unknown").length() > 0 & data.getString("node").length() > 0 & data.getString("num").length() > 0 ) {
            JSONArray similarNodes = treeController.getSimilarNodes(loggedInUser, data.getString("unknown"), currRecon.getLabel(), data.getString("node"), data.getInt("num"));

            //Return the list of matching node ids as a json array
            return similarNodes.toString();
        }

        return new JSONObject().put("error", "Make sure you have filled out the reconstruction label, node label, and number of similar nodes fields correctly").toString();

    }

    /**
     * Helper function to set the current reconstruction.
     */
    public void setReconFromASR(ASRObject asr, JSONObject ancestor, JSONObject msa) {

        currRecon = reconController.createFromASR(asr);

        // Set the anscestor and the msa
        currRecon.setAncestor(ancestor.toString());
        currRecon.setMsa(msa.toString());


        reconstructedNodes = new ArrayList<>();
        this.ancestor = ancestor;
        this.msa = msa;

        // Set the owner ID to be the logged in user
        currRecon.setOwnerId(loggedInUser.getId());

        // Set the current reconstruction of the owner to be this reconstruction
        userController.setCurrRecon(currRecon, loggedInUser);
    }

    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"getrecon"})
    public ModelAndView returnASR(Model model) {

        ModelAndView mav = new ModelAndView("index");

        // Here we need to update the reconstruction to have all the
        // parameters of the ASR.

        // Set some of the features that we'll need to be able to reconstruct
        // it correctly.
        JSONObject ancestorJson = asr.getAncestralGraphJSON(asr.getWorkingNodeLabel());
        JSONObject msaGraph = asr.getMSAGraphJSON();

        // Set the current reconstruction
        setReconFromASR(asr, ancestorJson, msaGraph);

        mav.addObject("label", asr.getLabel());

        // add reconstructed newick string to send to javascript
        mav.addObject("tree", asr.getReconstructedNewickString());

        // add msa and inferred ancestral graph
        String graphs = asr.catGraphJSONBuilder(msaGraph, ancestorJson);
        mav.addObject("graph", graphs);

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        mav.addObject("inferenceType", asr.getInferenceType());
        mav.addObject("results", true);
        mav.addObject("node", asr.getNodeLabel());
        mav.addObject("username", loggedInUser.getUsername());
        // Run reconstruction but first get the extent names so we can asynronously do a lookup with
        // NCBI to get the taxonomic iDs.
        JSONObject ids = new JSONObject();
        ArrayList<String> jointLabels = new ArrayList<>();
        try {
            ids = taxaController.getNonExistIdsFromProtId(seqController.getSeqLabelAsNamedMap(currRecon.getId()));
            jointLabels = seqController.getAllSeqLabels(currRecon.getId(), Defines.JOINT);
            if (jointLabels == null) {
                jointLabels = new ArrayList<>();
            }
        } catch (Exception e) {
            System.out.println(e);
        }
        mav.addObject("ids", ids.toString());
        mav.addObject("jointLabels", jointLabels);
        mav.addObject("saved", false);

        return mav;
    }


    @RequestMapping(value = "/", method = RequestMethod.POST, params = {"getrecongraph"})
    public @ResponseBody
    String returnASRGraph(@RequestParam("getrecongraph") String getrecongraph, Model model,
            HttpServletRequest request) {

        String graphs = "";

        if (runningMarginal) {
            graphs = marginalAsr.catGraphJSONBuilder(marginalAsr.getMSAGraphJSON(), marginalAsr.getAncestralGraphJSON(marginalAsr.getWorkingNodeLabel()));
            runningMarginal = false;
        } else {
            // add msa and inferred ancestral graph
            graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getWorkingNodeLabel()));
        }
        return graphs;
    }


    /**
     * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
     *
     * @param asrForm ASR object
     * @param bindingResult Form result, indicating any input errors
     * @param model com model
     * @return index with results as attributes in the model
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, params = "submitAsr")
    public ModelAndView performReconstruction(@Valid @ModelAttribute("asrForm") ASRObject asrForm,
            BindingResult bindingResult, Model model, HttpServletRequest request) throws Exception {

        this.asr = asrForm;
        // ToDo: Also check here that they have a unique label
        String err = null;
        if (asr.getLabel().equals("")) {
            err = "recon.require.label";
        } else {
            err = reconController.isLabelUnique(asr.getLabel());
        }

        if (err != null) {
            ModelAndView mav = new ModelAndView("index");
            mav.addObject("error", true);
            mav.addObject("errorMessage", err);
            mav.addObject("user", loggedInUser);
            mav.addObject("username", loggedInUser.getUsername());
            return mav;
        }

        logger.log(Level.INFO,
                "NEW, request_addr: " + request.getRemoteAddr() + ", infer_type: " + asr
                        .getInferenceType());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));

        Exception exception = asr.runForSession(sessionPath);

        if (exception != null) {
            ModelAndView mav = new ModelAndView("index");
            mav.addObject("error", true);
            String message = exception.getMessage();
            logger.log(Level.SEVERE, "ERR, request_addr: " + request
                    .getRemoteAddr() + " error: " + message);
            if (exception.getMessage() == null || exception.getMessage()
                    .contains("FileNotFoundException")) {
                message = checkErrors(asr);
            }
            mav.addObject("errorMessage", message);
            mav.addObject("user", loggedInUser);
            mav.addObject("username", loggedInUser.getUsername());

            return mav;
        }
        /**
         * Here if they are aiming to save it we just save and send an email
         */

        // ToDo: I have been horrible and just inverted this, if you are reading this I am sorry
        // I will fix this up when i get back from the US - for now accept by deepest appologies :'(
        if (!asr.getSave()) {
            // check if a user is logged in
            if (loggedInUser.getId() == Defines.FALSE) {
                ModelAndView mav = new ModelAndView("index");
                mav.addObject("errorMessage", "You need to be logged in to be able to save a reconstruction, sorry!");
                mav.addObject("user", loggedInUser);
                mav.addObject("error", true);
                return mav;
            }
            isSaving = saveController.getIsSaving();
            if (isSaving) {
                ModelAndView mav = new ModelAndView("index");
                mav.addObject("errorMessage", "You can only save one reconstruction at a time, sorry! We're working on batching this :) ");
                mav.addObject("user", loggedInUser);
                mav.addObject("error", true);
                return mav;
            }
            // Set the loggedin users email temp
            loggedInUser.setEmail(asr.getEmail());
            saveCurrReconStartThread();
            ModelAndView mav = accountView.get(loggedInUser, userController);
            mav.addObject("type", "saving");
            return mav;
        } else {
            recon = new ASRThread(asr, asr.getInferenceType(), asr.getNodeLabel(), false, logger,
                    loggedInUser, reconController);
        }
        ModelAndView mav = new ModelAndView("processing");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());

        return mav;
    }

    /**
     * Used to load the save attributes of a reconstruction.
     */
    public void loadReconToASR() {
        if (currRecon == null || currRecon.getId() != Defines.UNINIT) {
            currRecon = reconController.getByIdForMarginal(currRecon.getId(),
                    loggedInUser);
            asr = new ASRObject();
            asr.setLabel(currRecon.getLabel());
            asr.setInferenceType(currRecon.getInferenceType());
            asr.setModel(currRecon.getModel());
            asr.setNodeLabel(currRecon.getNode());
            asr.setTree(currRecon.getTree());
            asr.setReconstructedTree(currRecon.getReconTree());
            asr.setMSA(currRecon.getMsa());
            asr.setAncestor(currRecon.getAncestor());
            asr.loadSequences(currRecon.getSequences());
            asr.setJointInferences(currRecon.getJointInferences());
            asr.loadParameters();
            // Also set the ancestor and MSA
            ancestor = new JSONObject(currRecon.getAncestor());
            msa = new JSONObject(currRecon.getMsa());
        }
        if (runningMarginal) {
            marginalAsr = new ASRObject();
            marginalAsr.setLabel(asr.getLabel());
            marginalAsr.setInferenceType(asr.getInferenceType());
            marginalAsr.setModel(asr.getModel());
            marginalAsr.setTree(asr.getTree());
            marginalAsr.setReconstructedTree(asr.getReconstructedNewickString());
            marginalAsr.setMSA(asr.getMSA());
            marginalAsr.setAncestor(asr.getAncestor());
            marginalAsr.loadSequences(asr.getSequences());
            marginalAsr.setJointInferences(asr.getJointInferences());
            marginalAsr.loadParameters();
        }
    }

    /**
     * Perform marginal reconstruction of specified tree node.
     *
     * @param infer inference type (Expects marginal)
     * @param node node label
     * @param model com model
     * @return graphs in JSON format
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, params = {"infer", "node",
            "addgraph"})
    public ModelAndView performReconstruction(@RequestParam("infer") String infer,
            @RequestParam("node") String node, @RequestParam("addgraph") Boolean addGraph,
            Model model, HttpServletRequest request) {

        ModelAndView mav = new ModelAndView("processing");

        // run reconstruction
        // ToDo: look and run the recon for marginal otherwise just get the joint from the database
        if (!infer.equals("joint")) {
            /**
             * Here is where we need to load the whole reconstruction i.e. all the seqs etc
             *
             */
            runningMarginal = true;
            loadReconToASR();
            // Set the node label we want to infer.
            marginalAsr.setNodeLabel(node);
            // Run the thread
            recon = new ASRThread(marginalAsr, infer, node, addGraph, logger, loggedInUser,
                    reconController);
        }
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Creates a temporary session folder for users to save data in.
     */
    public void createTemporarySessionFolder() {
        if (asr.getSessionDir() == null) {
            File sessionDir = new File(sessionPath + asr.getSessionId());
            if (!sessionDir.exists()) {
                sessionDir.mkdir();
            }
            asr.setSessionDir(sessionDir.getAbsolutePath() + "/");
        }
    }

    /**
     * Download files from reconstruction
     *
     * @param request HTTP request (form request specifying parameters)
     * @param response HTTP response to send data to client
     */
    @RequestMapping(value = "/download-tutorial-files", method = RequestMethod.GET, produces = "application/zip")
    public void downloadTutorial(HttpServletRequest request, HttpServletResponse response)
            throws IOException, URISyntaxException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_Tutorial.zip\"");

        // create temporary folder to send output as zipped files
        createTemporarySessionFolder();

        String tempDir = asr.getSessionDir() + "/GRASP_Tutorial";
        File sessionDir = new File(tempDir);
        if (sessionDir.exists()) {
            for (File file : sessionDir.listFiles()) {
                file.delete();
            }
            sessionDir.delete();
        }
        sessionDir.mkdir();

        // copy output files to temporary folder, or generate output where needed and save in temporary folder
        File tutorialFile = new File(
                Thread.currentThread().getContextClassLoader().getResource(
                        "data/app/tutorial/GRASPTutorial.fasta")
                        .toURI());
        Files.copy(tutorialFile.toPath(), (new File(tempDir + "/GRASPTutorial.fasta")).toPath(),
                StandardCopyOption.REPLACE_EXISTING);

        // send output folder to client
        ZipOutputStream zout = new ZipOutputStream(response.getOutputStream());
        zipFiles(sessionDir, zout);
        zout.close();
    }

    /**
     * Download files from reconstruction
     *
     * @param request HTTP request (form request specifying parameters)
     * @param response HTTP response to send data to client
     */
    @RequestMapping(value = "/download-tutorial-files-aln", method = RequestMethod.GET, produces = "application/zip")
    public void downloadTutorialAln(HttpServletRequest request, HttpServletResponse response)
            throws IOException, URISyntaxException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_Tutorial.zip\"");

        // create temporary folder to send output as zipped files
        createTemporarySessionFolder();

        String tempDir = asr.getSessionDir() + "/GRASP_Tutorial";
        File sessionDir = new File(tempDir);
        if (sessionDir.exists()) {
            for (File file : sessionDir.listFiles()) {
                file.delete();
            }
            sessionDir.delete();
        }
        sessionDir.mkdir();

        // copy output files to temporary folder, or generate output where needed and save in temporary folder
        File tutorialFile = new File(
                Thread.currentThread().getContextClassLoader().getResource(
                        "data/app/tutorial/GRASPTutorial.aln")
                        .toURI());
        Files.copy(tutorialFile.toPath(), (new File(tempDir + "/GRASPTutorial.aln")).toPath(),
                StandardCopyOption.REPLACE_EXISTING);
        tutorialFile = new File(
                Thread.currentThread().getContextClassLoader().getResource(
                        "data/app/tutorial/GRASPTutorial.nwk")
                        .toURI());
        Files.copy(tutorialFile.toPath(), (new File(tempDir + "/GRASPTutorial.nwk")).toPath(),
                StandardCopyOption.REPLACE_EXISTING);

        // send output folder to client
        ZipOutputStream zout = new ZipOutputStream(response.getOutputStream());
        zipFiles(sessionDir, zout);
        zout.close();
    }

    /**
     * Download files from reconstruction
     *
     * @param request HTTP request (form request specifying parameters)
     * @param response HTTP response to send data to client
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params = "download", produces = "application/zip")
    public void showForm(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // Check if we are getting all the joint reconstructions
        ArrayList<String> ancs = new ArrayList<>();
        // If we have nothing just return
        if (request.getParameter("graphs-input").length() < 1) {
            return;
        }
        if (request.getParameter("graphs-input") != null && request.getParameter("graphs-input").length() > 2) {
            if (request.getParameter("graphs-input").equals("all")) {
                ancs = seqController.getAllSeqLabels(currRecon.getId(), Defines.JOINT);
            } else {
                String tmp = request.getParameter("graphs-input");
                JSONArray graphs = new JSONArray(tmp);
                for (int i = 0; i < graphs.length(); i++) {
                    ancs.add(graphs.getString(i));
                }
            }
            // Sort the array

            Collections.sort(ancs, new NaturalOrderComparator());

        }




        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Disposition",
                "attachment; filename=\"GRASP_" + asr.getLabel() + ".zip\"");

        // create temporary folder to send output as zipped files
        createTemporarySessionFolder();

        String tempDir = asr.getSessionDir() + "/GRASP_" + asr.getLabel();
        File sessionDir = new File(tempDir);
        if (sessionDir.exists()) {
            for (File file : sessionDir.listFiles()) {
                file.delete();
            }
            sessionDir.delete();
        }
        sessionDir.mkdir();

        // copy output files to temporary folder, or generate output where needed and save in temporary folder
        if (request.getParameter("check-recon-tree") != null && request
                .getParameter("check-recon-tree").equalsIgnoreCase("on")) {
            File nwkFile = new File(asr.getSessionDir() + asr.getReconstructedTreeFileName());
            if (nwkFile.exists()) {
                Files.copy((new File(asr.getSessionDir() + asr.getReconstructedTreeFileName()))
                                .toPath(),
                        (new File(tempDir + "/" + asr.getReconstructedTreeFileName())).toPath(),
                        StandardCopyOption.REPLACE_EXISTING);
            } else {
                // This means we have a saved reconstruction so we want to write it to a file.
                String reconTree = treeController.getReconTreeById(currRecon.getId(), loggedInUser.getId());
                treeController.saveTree(tempDir + "/reconstructed_tree.nwk", reconTree);
            }
        }
        if (request.getParameter("check-pog-msa") != null && request.getParameter("check-pog-msa")
                .equalsIgnoreCase("on")) {
            asr.saveMSA(tempDir + "/");
        }
        if (request.getParameter("check-pog-marg") != null && request.getParameter("check-pog-marg")
                .equalsIgnoreCase("on")) {
            asr.saveAncestorGraph(request.getParameter("node-label"), tempDir + "/", false);
        }
        if (request.getParameter("check-marg-dist") != null && request
                .getParameter("check-marg-dist").equalsIgnoreCase("on")) {
            asr.saveMarginalDistribution(tempDir, request.getParameter("joint-node"));
        }
        if (request.getParameter("check-pog-joint-single") != null && request
                .getParameter("check-pog-joint-single").equalsIgnoreCase("on")) {
            asr.saveAncestorGraph(request.getParameter("joint-node"), tempDir + "/", true);
        }
        if (request.getParameter("check-seq-marg") != null && request.getParameter("check-seq-marg")
                .equalsIgnoreCase("on")) {
            asr.saveConsensusMarginal(
                    tempDir + "/" + request.getParameter("joint-node") + "_consensus");
        }
        if (ancs.size() > 0) {
            BufferedWriter bw = new BufferedWriter(new FileWriter(tempDir + "/joint_recon.fa", false));
            for (String nodeLabel: ancs) {
                seqController.saveAncestorToFile(bw, nodeLabel, currRecon.getId(), Defines.JOINT, "");
            }
            bw.close();
        }

        // send output folder to client
        ZipOutputStream zout = new ZipOutputStream(response.getOutputStream());
        zipFiles(sessionDir, zout);
        zout.close();

    }



    /**
     * Helper functions to zip files/directories
     **/
    private void zipFiles(File folder, ZipOutputStream zout) throws IOException {
        for (File file : folder.listFiles()) {
            if (file.isFile()) {
                zout.putNextEntry(new ZipEntry(file.getName()));
                FileInputStream fis = new FileInputStream(file);
                IOUtils.copy(fis, zout);
                fis.close();
                zout.closeEntry();
            }
        }
    }

    private String checkErrors(ASRObject asr) {
        String message = null;
        if (!asr.getLoaded()) {
            if ((asr.getData() == null || asr.getData().equalsIgnoreCase("") || asr.getData()
                    .equalsIgnoreCase("none"))
                    && (asr.getSeqFile() == null || asr.getSeqFile().getOriginalFilename()
                    .equalsIgnoreCase("")) &&
                    (asr.getAlnFile() == null || asr.getAlnFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) {
                message = "No sequence or alignment file specified.";
            } else if ((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename()
                    .endsWith(".aln") &&
                    !asr.getSeqFile().getOriginalFilename().endsWith(".fa") && !asr.getSeqFile()
                    .getOriginalFilename().endsWith(".fasta")) ||
                    (asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename()
                            .endsWith(".aln") &&
                            !asr.getAlnFile().getOriginalFilename().endsWith(".fa") && !asr
                            .getAlnFile().getOriginalFilename().endsWith(".fasta"))) {
                message = "Incorrect sequence or alignment format (requires FASTA or Clustal format .aln, .fa or .fasta).";
            } else if (((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename()
                    .equalsIgnoreCase("")) ||
                    (asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) &&
                    (asr.getTreeFile() == null || asr.getTreeFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) {
                message = "No phylogenetic tree file specified.";
            } else if (asr.getTreeFile() != null && !asr.getTreeFile().getOriginalFilename()
                    .endsWith(".nwk")) {
                message = "Incorrect phylogenetic tree format (requires Newick format .nwk).";
            }
        }
        return message;
    }

}
