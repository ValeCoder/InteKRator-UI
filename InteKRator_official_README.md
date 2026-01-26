<img src="logo.png" alt="InteKRator Logo" width="255">

# InteKRator

InteKRator is a lightweight toolbox for integrating machine learning and knowledge representation in the context of learning agents (and other applications). 
It is build around the concepts of knowledge bases with multiple abstraction levels, which are addressed in several scientific works:

* Studying privacy issues ([Heilman, Henkys, Apeldoorn, Strauch, Schmidt, Lilienthal, Panholzer 2024](https://doi.org/10.3233/SHTI240866))

* Overview of some preliminary works ([Apeldoorn 2024](https://doi.org/10.1007/s13218-024-00845-w))

* Comparison/incorporation of reasoning and learning approaches for cancer therapy research ([Thevapalan, Apeldoorn, Kern-Isberner, Meyer, Nietzke, Panholzer 2023](https://doi.org/10.3233/SHTI230709))

* Comprehensible knowledge base extraction for learning agents (dissertation, [Apeldoorn 2023](http://doi.org/10.25358/openscience-9303); also available as [book](https://d-nb.info/129619096X))

* Automated creation of expert systems from data ([Apeldoorn, Panholzer 2021](https://ebooks.iospress.nl/volumearticle/57501))

* Learning behavioral rules for optimizing hospital processes ([Apeldoorn, Hadidi, Panholzer 2021](https://link.springer.com/chapter/10.1007/978-3-030-80253-0_2))

* Learning and revising forward models of games ([Apeldoorn, Dockhorn 2020](https://ieeexplore.ieee.org/document/9136897) and [Dockhorn, Apeldoorn 2018](https://ieeexplore.ieee.org/document/8490411))

* Representing and exploiting human intuitions for optimizing job-shop problems ([Kuhn 2019](https://dl.gi.de/bitstream/handle/20.500.12116/29000/SKILL2019-08.pdf?sequence=1&isAllowed=y))

* Finding heuristics in unknown environments ([Apeldoorn, Kern-Isberner 2017](http://ceur-ws.org/Vol-2052/paper1.pdf) and [Apeldoorn, Kern-Isberner 2016](https://easychair.org/publications/open/xrz))

* Representing the behavior of learning agents ([Apeldoorn, Kern-Isberner 2017](https://aaai.org/ocs/index.php/FLAIRS/FLAIRS17/paper/view/15510/15038))

* Measuring the strategic depth of games ([Apeldoorn, Volz 2017](http://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=8080409))

* Comparison to Answer Set Programming ([Krüger, Apeldoorn, Kern-Isberner 2017](http://qrg.northwestern.edu/qr2017/papers/QR2017_paper_11.pdf))

InteKRator is an open-source project licensed under [GNU GPLv3](https://gitlab.com/dapel1/intekrator_toolbox/-/blob/master/LICENSE).


# Getting Started

The InteKRator toolbox can be used as a console application (for calling it manually or from other applications as external process). 
It is also possible to use it as a Java library. 

For using InteKRator as console application, download the most recent version of "InteKRator.jar" from the [releases page](https://gitlab.com/dapel1/intekrator_toolbox/-/releases) and use the command below (requires [Java](http://openjdk.java.net/); note that not all of the parameters are implemented yet).

Command: 
    
    java -jar InteKRator.jar PARAMETERS INFILE [OUTFILE] [...]

This command processes the INFILE according to the given PARAMETERS and
optionally writes the results in the OUTFILE (if provided).
If no OUTFILE is provided (and -silent is not used), the results are only
written to standard out.
Optionally, multiple PARAMETERS INFILE [OUTFILE] sequences can be used for
sequential processing.

    PARAMETERS:
    -learn [OPTIONS]: Learns a knowledge base from data in form of state-action
                      pairs contained in INFILE. 
                      Each line of the file must be of the form s1 ... sn a
                      (separated by space characters) where s1 ... sn describes
                      an agent's state in which the action a was performed.
    
                      OPTIONS:
                      top: Ensures resulting knowledge base has a top level rule
                           (even if not needed for inference on the provided
                           data).
                      all: Ensures resulting knowledge base includes all rules
                           learned from data (even those that are not needed
                           for inference on the provided data).
                      discretize [C}N ...] [C}NAMES ...] [info C ...]:
                                 Discretizes numeric data columns by clustering.
                                 If C}N ... is provided, each column C (where 1
                                 denotes the first colum) will be discretized
                                 to at most N symbols, each representing one
                                 cluster.
                                 If C}NAMES ... is provided, NAMES must be a
                                 comma-separated list of names (without space
                                 characters). Each column C will be discretized to
                                 a maximum number of clusters according to the
                                 number of names provided, and the names will be
                                 used for the resulting cluster symbols.
                                 If info-option is provided, additional
                                 information about the number of clusters and the
                                 percentage covered by a specific cluster symbol
                                 will be provided for the each column C ... .
                                 In either case, the any-keyword can be used for C
                                 to denote all columns.
                      preselect [N]: Only the most promising sensors are
                                     considered for learning (increases speed!). 
                                     If N is provided, only the N most promising
                                     sensors are considered (otherwise N is
                                     inferred from data).
                      sample N[%]: Only N state-action pairs are randomly selected
                                   for learning.
                                   If % is provided, N percent of the state-action
                                   pairs are randomly selected instead.
                                   Sampling can extremely speed up the learning
                                   process, but may result in incomplete 
                                   representations (not inference-safe!). 
                                   For keeping inference-safety, the resulting
                                   knowledge base can be revised subsequently with
                                   the INFILE (use -reviseMulti), resulting in a
                                   less compact but complete representation.
                      avoid SUFFIX: Avoids learning of rules with premises
                                    containing values with the provided SUFFIX.
                                    Can be used, e.g., for excluding missing
                                    values, but may result in incomplete
                                    representations (not inference-safe!).
                      important [SD]: Highlights the most important rules based
                                      on standard deviation SD (if provided).
                                      If SD is not provided, 1 will be assumed.
                      importantOnly [SD]: Same as important, but only the
                                          important rules will be shown (not
                                          inference-safe!). 
    -infer [why] STATE: Infers one (or more) action(s) for the given STATE from a
                        knowledge base contained in the INFILE. If more than one
                        action is inferred this means that the inferred actions
                        are equally good according to the knowledge contained in
                        the knowledge base. If why-option is provided, the rules
                        will be shown based on which the inference was performed.
                        The STATE must be of the form s1 ... sn (separated by
                        space characters).
    -revise PAIR: Revises the knowledge base contained in the INFILE with the
                  provided state-action PAIR.
                  The state-action PAIR must be of the form s1 ... sn a
                  (separated by space characters).
    -inferMulti [why] FILE: Infers one (or more) action(s) for each state in FILE
                            from a knowledge base contained in the INFILE.
                            Every line of the FILE represents one state of the
                            form s1 ... sn (separated by space characters).
                            The results for each state are separated by empty
                            lines.
                            The why-option works in the same way as for -infer.
    -reviseMulti FILE: Revises the knowledge base contained in the INFILE with
                       the state-action pairs in the provided FILE.
                       Every line of FILE represents one state-action pair of
                       the form s1 ... sn a (separated by space characters).
    -check [details] FILE: Checks the knowledge base contained in the INFILE
                           against the state-action sequence contained in FILE
                           and returns the percentage of covered state-action
                           pairs for which the correctconclusion is returned.
                           If details-option is provided, the result is
                           additionally shown individually for each action.
    -silent: Results will not be written to standard out.
    -progress [details] [FILE]: Writes the progress of the current operation
                                to FILE (if provided). If FILE is not provided,
                                the progress will be written to standard out
                                out instead. If details-option is provided, the
                                progress is additionally shown individually for
                                each action.
    -verbose: Writes additional information to standard out (e.g., time needed).
    -help: Shows this help text.


<br />Parts of the research in the context of this project are supported by:

[<img src="https://topml.uni-mainz.de/files/2022/12/Logo_TOPML_rgb_klein-300x192.jpg" alt="InteKRator Logo" width="155">](https://topml.uni-mainz.de/)
