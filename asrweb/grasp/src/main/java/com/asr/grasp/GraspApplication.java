package com.asr.grasp;

import com.asr.grasp.service.IReconstructionService;
import com.asr.grasp.service.IUserService;
import com.asr.grasp.validator.LoginValidator;
import com.asr.grasp.validator.UserValidator;
import json.JSONArray;
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
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;


@Controller
@SpringBootApplication
@SessionScope
public class GraspApplication extends SpringBootServletInitializer {

	//final static String sessionPath = "/Users/marnie/Documents/WebSessions/";
//		final String sessionPath = "/Users/gabefoley/Documents/WebSessions/";
	private final static String sessionPath = "/var/www/GRASP/";

	private final int MAX_RECONS = 20; // maximum number of reconstructions that a user can save

	private final static Logger logger = Logger.getLogger(GraspApplication.class.getName());

	private ASRThread recon = null;


	@Autowired
	private IUserService service;

	@Autowired
	private IReconstructionService reconstructionService;

	@Autowired
	private UserValidator userValidator;

	@Autowired
	private LoginValidator loginValidator;

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(GraspApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication.run(GraspApplication.class, args);
	}


	@Autowired
	private ASR asr;

	private User loggedInUser = new User();
	private Reconstruction currentRecon = null;

	/**
	 * Initialise the initial form in the index
	 *
	 * @return index html
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public ModelAndView showForm(Model model) {
		this.asr = new ASR();
		model.addAttribute("asrForm", this.asr);
		model.addAttribute("username", loggedInUser.getUsername());
		return new ModelAndView("index");
	}

	@RequestMapping(value = "/register", method = RequestMethod.GET)
	public ModelAndView showRegistrationForm(WebRequest request, Model model) {
		model.addAttribute("user", new User());
		return new ModelAndView("register");
	}

	@RequestMapping(value = "/login", method = RequestMethod.GET)
	public ModelAndView showLoginForm(WebRequest request, Model model) {
		model.addAttribute("user", new User());
		model.addAttribute("username", null);
		loggedInUser = new User();
		return new ModelAndView("login");
	}

	@RequestMapping(value = "/account", method = RequestMethod.GET)
	public ModelAndView showAccount(WebRequest request, Model model) {
		ModelAndView mav = new ModelAndView("account");
		mav.addObject("user", loggedInUser);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", loggedInUser.getNonSharedReconstructions());
		mav.addObject("sharedreconstructions", service.getSharedReconstructions(loggedInUser));
		mav.addObject("username", loggedInUser.getUsername());
		return mav;
	}

	@RequestMapping(value = "/", method = RequestMethod.GET, params = {"cancel"})
	public ModelAndView cancelRecon(WebRequest request, Model model) {
		if (recon != null)
			recon.interrupt();

		if (asr.performedRecon())
			return returnASR(model);

		return showForm(model);

	}

	@RequestMapping(value = "/", method = RequestMethod.GET, params = {"delete", "id"})
	public ModelAndView deleteRecon(@RequestParam("delete") String delete, @RequestParam("id") Long id, WebRequest webrequest, Model model) {
		ModelAndView mav = new ModelAndView("account");
		loggedInUser = service.removeReconstruction(loggedInUser, id);
		mav.addObject("user", loggedInUser);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", loggedInUser.getNonSharedReconstructions());
		mav.addObject("sharedreconstructions", service.getSharedReconstructions(loggedInUser));
		mav.addObject("username", loggedInUser.getUsername());
		mav.addObject("type", "deleted");
		if (currentRecon != null) {
			loggedInUser = reconstructionService.saveNewReconstruction(currentRecon, loggedInUser);
			mav.addObject("type", "saved");
		}
		currentRecon = null;
		mav.addObject("warning", null);
		return mav;
	}

	@RequestMapping(value = "/", method = RequestMethod.POST, params = {"share"})
	public ModelAndView shareRecon(@RequestParam("share") String share, @ModelAttribute("share") ShareObject user, BindingResult bindingResult, Model model, HttpServletRequest request) {
		ModelAndView mav = new ModelAndView("account");
		mav.addObject("user", loggedInUser);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", loggedInUser.getNonSharedReconstructions());
		mav.addObject("sharedreconstructions", service.getSharedReconstructions(loggedInUser));
		mav.addObject("username", loggedInUser.getUsername());

		// check if user exists
		if (service.userExist(user.getUsername())) {
			User u = service.getUser(user.getUsername());
			Reconstruction recon = reconstructionService.getReconstruction(user.getReconID());
			u.addSharedReconstruction(recon);
			recon.addUser(u);
			reconstructionService.saveReconstruction(recon);
			service.saveUser(u);
			mav.addObject("type", "shared");
		} else {
			mav.addObject("error", user.getUsername());
		}
		mav.addObject("warning", null);

		return mav;
	}

	@RequestMapping(value = "/", method = RequestMethod.GET, params = {"load", "id"})
	public ModelAndView loadRecon(@RequestParam("load") String load, @RequestParam("id") Long id, WebRequest webrequest, Model model) {

		Reconstruction recon = reconstructionService.getReconstruction(id);
		asr = new ASR();
		asr.setLabel(recon.getLabel());
		asr.setInferenceType(recon.getInferenceType());
		asr.setModel(recon.getModel());
		asr.setNodeLabel(recon.getNode());
		asr.setTree(recon.getTree());
		asr.setReconstructedTree(recon.getReconTree());
		asr.setMSA(recon.getMsa());
		asr.setAncestor(recon.getAncestor());
		asr.loadSequences(recon.getSequences());
		asr.setJointInferences(recon.getJointInferences());
		asr.loadParameters();

		ModelAndView mav = new ModelAndView("index");

		mav.addObject("label", asr.getLabel());

		// add reconstructed newick string to send to javascript
		mav.addObject("tree", asr.getReconstructedNewickString());

		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraph(), asr.getAncestorGraph());
		mav.addObject("graph", graphs);

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		mav.addObject("inferenceType", asr.getInferenceType());
		mav.addObject("node", asr.getNodeLabel());
		mav.addObject("results", true);

		mav.addObject("user", loggedInUser);
		mav.addObject("username", loggedInUser.getUsername());
		return mav;
	}

	@RequestMapping(value = "/login", method = RequestMethod.POST)
	public ModelAndView loginUser(@Valid @ModelAttribute("user") User user, BindingResult bindingResult, Model model, HttpServletRequest request) {
		loginValidator.validate(user, bindingResult);
		if (bindingResult.hasErrors())
			return new ModelAndView("login");
		User registered = getUserAccount(user);

		ModelAndView mav = new ModelAndView("account");

		if (currentRecon != null) {
			if (registered.getNonSharedReconstructions().size() == MAX_RECONS) {
				mav.addObject("warning", MAX_RECONS);
				mav.addObject("type", null);
			} else {
				registered = reconstructionService.saveNewReconstruction(currentRecon, registered);
				mav.addObject("type", "saved");
				currentRecon = null;
			}
		}

		mav.addObject("user", registered);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", registered.getNonSharedReconstructions());
		mav.addObject("sharedreconstructions", service.getSharedReconstructions(registered));

		System.out.println(registered.getUsername());
		for (Reconstruction r : registered.getNonSharedReconstructions())
			System.out.println("r: " + r.getId());
		for (Reconstruction r : service.getSharedReconstructions(registered))
			System.out.println("s: " + r.getId());
		loggedInUser = registered;
		return mav;
	}

	@RequestMapping(value = "/register", method = RequestMethod.POST)
	public ModelAndView registerUser(@Valid @ModelAttribute("user") User user,  BindingResult bindingResult, Model model, HttpServletRequest request) {
		userValidator.validate(user, bindingResult);
		if (bindingResult.hasErrors())
			return new ModelAndView("register");
		User registered = new User();
		if (!bindingResult.hasErrors())
			registered = createUserAccount(user);

		if (currentRecon != null)
			registered = reconstructionService.saveNewReconstruction(currentRecon, registered);
		currentRecon = null;

		ModelAndView mav = new ModelAndView("account");
		mav.addObject("user", registered);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", registered.getNonSharedReconstructions());
		loggedInUser = registered;
		return mav;
	}

	private User createUserAccount(User user){
		return service.registerNewUserAccount(user);
	}

	private User getUserAccount(User user){
		return service.getUserAccount(user);
	}

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
		Reconstruction recon = new Reconstruction();
		recon.setTree(asr.getTree());
		recon.setInferenceType(asr.getInferenceType());
		recon.setNumThreads(asr.getNumberThreads());
		recon.setLabel(asr.getLabel());
		recon.setMsa(asr.getMSAGraphJSON().toString());
		recon.setModel(asr.getModel());
		recon.setReconTree(asr.getReconstructedNewickString());
		recon.setNode(asr.getNodeLabel());
		recon.setJointInferences(asr.getJointInferences());
		recon.setSequences(asr.getSequences());
		recon.setAncestor(asr.getAncestralGraphJSON(asr.getNodeLabel()).toString());

		// if a user is not logged in, prompt to login
		if (loggedInUser.getUsername() == null || loggedInUser.getUsername() == "") {
			currentRecon = recon;
			ModelAndView mav = new ModelAndView("login");
			mav.addObject("user", loggedInUser);
			return mav;
		}

		// if the user already has N reconstructions saved, prompt to delete some
		if (loggedInUser.getNonSharedReconstructions().size() == MAX_RECONS) {
			currentRecon = recon;
			ModelAndView mav = new ModelAndView("account");
			mav.addObject("user", loggedInUser);
			mav.addObject("share", new ShareObject());
			mav.addObject("reconstructions", loggedInUser.getNonSharedReconstructions());
			mav.addObject("sharedreconstructions", service.getSharedReconstructions(loggedInUser));
			mav.addObject("username", loggedInUser.getUsername());
			mav.addObject("warning", MAX_RECONS);
			mav.addObject("type", null);
			return mav;
		}

		loggedInUser = reconstructionService.saveNewReconstruction(recon, loggedInUser);

		ModelAndView mav = new ModelAndView("account");
		mav.addObject("user", loggedInUser);
		mav.addObject("share", new ShareObject());
		mav.addObject("reconstructions", loggedInUser.getNonSharedReconstructions());
		mav.addObject("sharedreconstructions", service.getSharedReconstructions(loggedInUser));
		mav.addObject("username", loggedInUser.getUsername());
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
		mav.addObject("errorMessage", "Sorry! An unknown error occurred. Please check the error types in the guide and retry your reconstruction... ");
		mav.addObject("username",  loggedInUser.getUsername());
		return mav;
	}

	/**
	 * Show status of reconstruction while asynchronously performing analysis
	 *
	 * @return status of reconstruction
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET, params = {"request"})
	public @ResponseBody String showStatus(@RequestParam("request") String request, Model model) throws Exception {

		String status = recon.getStatus();

		if (status != null && (status.equalsIgnoreCase("done") || status.contains("error"))) {
			String stat = status;
			asr.setFirstPass(true); // reset flag
			asr.setPrevProgress(0);
			return stat;
		}

		// try to get current node ID
		int progress = asr.getNumberAlnCols() == 0 ? 0 : (100*asr.getReconCurrentNodeId())/asr.getNumberAlnCols();
		if (asr.getFirstPass() && progress < asr.getPrevProgress())
			asr.setFirstPass(false);

		progress = asr.getFirstPass() ? progress/2 : 50 + progress/2;
		if (progress > asr.getPrevProgress())
			asr.setPrevProgress(progress);

		return asr.getPrevProgress() + "%";
	}

	@RequestMapping(value = "/", method = RequestMethod.GET, params={"getrecon"})
	public ModelAndView returnASR(Model model) {

		ModelAndView mav = new ModelAndView("index");

		mav.addObject("label", asr.getLabel());

		// add reconstructed newick string to send to javascript
		mav.addObject("tree", asr.getReconstructedNewickString());

		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getWorkingNodeLabel()));
		mav.addObject("graph", graphs);

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		mav.addObject("inferenceType", asr.getInferenceType());
		mav.addObject("results", true);
		mav.addObject("node", asr.getNodeLabel());
		mav.addObject("username",  loggedInUser.getUsername());

		return mav;
	}

	@RequestMapping(value = "/", method = RequestMethod.POST, params={"getrecongraph"})
	public @ResponseBody String returnASRGraph(@RequestParam("getrecongraph") String getrecongraph, Model model, HttpServletRequest request) {

		model.addAttribute("label", asr.getLabel());

		// add reconstructed newick string to send to javascript
		model.addAttribute("tree", asr.getReconstructedNewickString());

		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getWorkingNodeLabel()));
		model.addAttribute("graph", graphs);

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		model.addAttribute("inferenceType", asr.getInferenceType());
		model.addAttribute("results", true);
		model.addAttribute("node", asr.getNodeLabel());
		model.addAttribute("username",  loggedInUser.getUsername());

		return graphs;
	}


	/**
	 * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
	 *
	 * @param asrForm       ASR object
	 * @param bindingResult Form result, indicating any input errors
	 * @param model         com model
	 * @return index with results as attributes in the model
	 */
	@RequestMapping(value = "/", method = RequestMethod.POST, params = "submitAsr")
	public ModelAndView performReconstruction(@Valid @ModelAttribute("asrForm") ASR asrForm, BindingResult bindingResult, Model model, HttpServletRequest request) throws Exception {

		this.asr = asrForm;

		logger.log(Level.INFO, "NEW, request_addr: " + request.getRemoteAddr() + ", infer_type: " + asr.getInferenceType());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));


		// upload supplied files
		try {
			File sessionDir = new File(sessionPath + asr.getSessionId());
			if (!sessionDir.exists())
				sessionDir.mkdir();

			asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

			if (asr.getSeqFile() != null || asr.getAlnFile() != null) {
				// aligning input data before performing reconstruction
				if (asr.getSeqFile() != null) {
					asr.getSeqFile().transferTo(new File(asr.getSessionDir() + asr.getSeqFile().getOriginalFilename()));
					asr.setAlnFilepath(asr.getSessionDir() + asr.getSeqFile().getOriginalFilename());
					asr.setPerformAlignment(true);
				}
				// performing reconstruction on already aligned data
				if (asr.getAlnFile() != null) {
					asr.getAlnFile().transferTo(new File(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename()));
					asr.setAlnFilepath(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename());
				}
				asr.getTreeFile().transferTo(new File(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename()));
				asr.setTreeFilepath(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename());
			} else {
				// performing reconstruction on test data
				File alnFile = new File(Thread.currentThread().getContextClassLoader().getResource(asr.getData() + ".aln").toURI());
				asr.setAlnFilepath(asr.getSessionDir() + asr.getData() + ".aln");
				Files.copy(alnFile.toPath(), (new File(asr.getAlnFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
				File treeFile = new File(Thread.currentThread().getContextClassLoader().getResource(asr.getData() + ".nwk").toURI());
				asr.setTreeFilepath(asr.getSessionDir() + asr.getData() + ".nwk");
				Files.copy(treeFile.toPath(), (new File(asr.getTreeFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
			}

			if (asr.getLabel() == "")
				asr.setLabel("Grasp");

		} catch (Exception e) {
			ModelAndView mav = new ModelAndView("index");
			mav.addObject("error", true);
			String message = e.getMessage();
			logger.log(Level.SEVERE, "ERR, request_addr: " + request.getRemoteAddr() + " error: " + message);
			if (e.getMessage() == null || e.getMessage().contains("FileNotFoundException"))
				message = checkErrors(asr);
			mav.addObject("errorMessage", message);
			mav.addObject("user", loggedInUser);
			mav.addObject("username", loggedInUser.getUsername());
			System.err.println("Error: " + message);
			return mav;
		}

		// run reconstruction
		recon = new ASRThread(asr, asr.getInferenceType(), asr.getNodeLabel(), false, logger);

		ModelAndView mav = new ModelAndView("processing");
		mav.addObject("user", loggedInUser);
		mav.addObject("username", loggedInUser.getUsername());
		return mav;
	}

	/**
	 * Perform marginal reconstruction of specified tree node.
	 *
	 * @param infer inference type (Expects marginal)
	 * @param node  node label
	 * @param model com model
	 * @return graphs in JSON format
	 */
	@RequestMapping(value = "/", method = RequestMethod.POST, params = {"infer", "node", "addgraph"})
	public ModelAndView performReconstruction(@RequestParam("infer") String infer, @RequestParam("node") String node, @RequestParam("addgraph") Boolean addGraph, Model model, HttpServletRequest request) {

		ModelAndView mav = new ModelAndView("processing");

		// run reconstruction
		recon = new ASRThread(asr, infer, node, addGraph, logger);

		mav.addObject("username",  loggedInUser.getUsername());
		return mav;
	}

	/**
	 * Download files from reconstruction
	 *
	 * @param request   HTTP request (form request specifying parameters)
	 * @param response  HTTP response to send data to client
	 * @throws IOException
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET, params = "download", produces = "application/zip")
	public void showForm(HttpServletRequest request, HttpServletResponse response) throws IOException {
		JSONArray graphs = new JSONArray(request.getParameter("graphs-input"));
		String[] ancs = new String[graphs.length()];
		for (int i = 0; i < graphs.length(); i++)
			ancs[i] = graphs.getString(i);

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_" + asr.getLabel() + ".zip\"");

		// create temporary folder to send output as zipped files
		if (asr.getSessionDir() == null) {
			File sessionDir = new File(sessionPath + asr.getSessionId());
			if (!sessionDir.exists())
				sessionDir.mkdir();
			asr.setSessionDir(sessionDir.getAbsolutePath() + "/");
		}

		String tempDir = asr.getSessionDir() + "/GRASP_" + asr.getLabel();
		File sessionDir = new File(tempDir);
		if (sessionDir.exists()) {
			for (File file : sessionDir.listFiles())
				file.delete();
			sessionDir.delete();
		}
		sessionDir.mkdir();


		// copy output files to temporary folder, or generate output where needed and save in temporary folder
		if (request.getParameter("check-recon-tree") != null && request.getParameter("check-recon-tree").equalsIgnoreCase("on")) {
			File nwkFile = new File(asr.getSessionDir() + asr.getReconstructedTreeFileName());
			if (nwkFile.exists())
				Files.copy((new File(asr.getSessionDir() + asr.getReconstructedTreeFileName())).toPath(),
					(new File(tempDir + "/" + asr.getReconstructedTreeFileName())).toPath(), StandardCopyOption.REPLACE_EXISTING);
			else
				asr.saveTree((new File(tempDir + "/" + asr.getReconstructedTreeFileName())).toPath().toString());
		}
		if (request.getParameter("check-pog-msa") != null && request.getParameter("check-pog-msa").equalsIgnoreCase("on"))
			asr.saveMSA(tempDir + "/");
		if (request.getParameter("check-pog-marg") != null && request.getParameter("check-pog-marg").equalsIgnoreCase("on"))
			asr.saveAncestorGraph(request.getParameter("node-label"), tempDir + "/", false);
		if (request.getParameter("check-marg-dist") != null && request.getParameter("check-marg-dist").equalsIgnoreCase("on"))
			asr.saveMarginalDistribution(tempDir, request.getParameter("marg-node"));
		if (request.getParameter("check-pog-joint") != null && request.getParameter("check-pog-joint").equalsIgnoreCase("on"))
			asr.saveAncestors(tempDir + "/", ancs);
		if (request.getParameter("check-pog-joint-single") != null && request.getParameter("check-pog-joint-single").equalsIgnoreCase("on"))
			asr.saveAncestorGraph(request.getParameter("joint-node"), tempDir + "/", true);
		if (request.getParameter("check-seq-marg") != null && request.getParameter("check-seq-marg").equalsIgnoreCase("on"))
			asr.saveConsensusMarginal(tempDir + "/" + request.getParameter("marg-node") + "_consensus");
		if (request.getParameter("check-seq-joint-single") != null && request.getParameter("check-seq-joint-single").equalsIgnoreCase("on"))
			asr.saveConsensusJoint(tempDir + "/" + request.getParameter("joint-node") + "_consensus", request.getParameter("joint-node"));
		if (request.getParameter("check-msa-marg-dist") != null && request.getParameter("check-msa-marg-dist").equalsIgnoreCase("on"))
			asr.saveMarginalDistribution(tempDir + "/", "msa");
		if (request.getParameter("check-seq-joint") != null && request.getParameter("check-seq-joint").equalsIgnoreCase("on"))
			asr.saveConsensusJoint(tempDir + "/ancestors_consensus", ancs);
		if (request.getParameter("check-msa-aln") != null && request.getParameter("check-msa-aln").equalsIgnoreCase("on"))
			asr.saveMSAAln(tempDir + "/" + asr.getLabel());

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

	private String checkErrors(ASR asr) {
		String message = null;
		if (!asr.getLoaded())
			if ((asr.getData() == null || asr.getData().equalsIgnoreCase("") || asr.getData().equalsIgnoreCase("none"))
					&& (asr.getSeqFile() == null || asr.getSeqFile().getOriginalFilename().equalsIgnoreCase("")) &&
					(asr.getAlnFile() == null || asr.getAlnFile().getOriginalFilename().equalsIgnoreCase("")))
				message = "No sequence or alignment file specified.";
			else if ((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename().endsWith(".aln") &&
					!asr.getSeqFile().getOriginalFilename().endsWith(".fa") && !asr.getSeqFile().getOriginalFilename().endsWith(".fasta")) ||
					(asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename().endsWith(".aln") &&
						!asr.getAlnFile().getOriginalFilename().endsWith(".fa") && !asr.getAlnFile().getOriginalFilename().endsWith(".fasta")))
				message = "Incorrect sequence or alignment format (requires FASTA or Clustal format .aln, .fa or .fasta).";
			else if (((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename().equalsIgnoreCase("")) ||
					(asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename().equalsIgnoreCase(""))) &&
					(asr.getTreeFile() == null || asr.getTreeFile().getOriginalFilename().equalsIgnoreCase("")))
				message = "No phylogenetic tree file specified.";
			else if (asr.getTreeFile() != null && !asr.getTreeFile().getOriginalFilename().endsWith(".nwk"))
				message = "Incorrect phylogenetic tree format (requires Newick format .nwk).";
		return message;
	}

}
