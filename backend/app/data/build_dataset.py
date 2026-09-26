"""
Generates data/dataset.json: ~30 sample documents covering machine learning,
search/graph theory and supporting math/CS topics, with realistic hyperlinks
between them. Run once with `python build_dataset.py` to regenerate the file
that the app actually loads at runtime (dataset.json is checked in, so this
script does not need to run in production).
"""
import json
import os

DOCS = [
    dict(id="ml", title="Machine Learning Fundamentals", url="https://example.edu/wiki/machine-learning",
         description="An introduction to how machines learn patterns from data instead of following hard-coded rules.",
         content="Machine learning is the study of algorithms that improve their performance on a task through "
                 "experience, usually expressed as training data. Supervised learning maps inputs to known outputs, "
                 "unsupervised learning finds structure in unlabeled data, and reinforcement learning learns from "
                 "reward signals. Common models include linear regression, decision trees, support vector machines "
                 "and neural networks. Evaluating a model well, avoiding overfitting, and choosing the right features "
                 "matter as much as the algorithm itself.",
         links=["nn", "dl", "python", "gradient-descent", "scikit-learn", "statistics", "overfitting", "features"]),
    dict(id="nn", title="Neural Networks Explained", url="https://example.edu/wiki/neural-networks",
         description="How layers of artificial neurons combine to approximate complex functions.",
         content="A neural network is built from layers of simple units called neurons, each computing a weighted "
                 "sum of its inputs followed by a nonlinear activation function. Stacking layers lets the network "
                 "approximate very complex functions. Training adjusts the weights using backpropagation, which "
                 "computes how much each weight contributed to the error and nudges it in the direction that "
                 "reduces that error, one gradient step at a time.",
         links=["ml", "dl", "gradient-descent", "backprop", "linear-algebra", "activation-functions"]),
    dict(id="dl", title="Deep Learning Guide", url="https://example.edu/wiki/deep-learning",
         description="Why depth helps neural networks learn richer representations of raw data.",
         content="Deep learning refers to neural networks with many hidden layers, which lets the model learn a "
                 "hierarchy of features automatically instead of relying on hand-engineered inputs. Convolutional "
                 "networks are well suited to images, recurrent and transformer architectures handle sequences such "
                 "as text and audio, and large models trained on huge datasets have driven much of the recent "
                 "progress in the field.",
         links=["ml", "nn", "python", "transformers", "cnn", "backprop"]),
    dict(id="python", title="Python for Data Science", url="https://example.edu/wiki/python-data-science",
         description="The Python libraries that make up a typical data science workflow.",
         content="Python has become the default language for data science because of its readable syntax and its "
                 "ecosystem of libraries. NumPy provides fast array operations, pandas handles tabular data, "
                 "scikit-learn covers classical machine learning, and frameworks like PyTorch and TensorFlow support "
                 "deep learning. Jupyter notebooks let practitioners mix code, output and notes in one document.",
         links=["numpy", "scikit-learn", "ml", "statistics", "data-cleaning"]),
    dict(id="gradient-descent", title="Gradient Descent Explained", url="https://example.edu/wiki/gradient-descent",
         description="The optimization method that trains most machine learning models.",
         content="Gradient descent minimizes a loss function by repeatedly moving parameters in the direction that "
                 "reduces the loss fastest, scaled by a learning rate. Stochastic gradient descent estimates that "
                 "direction from a small batch of examples rather than the whole dataset, which makes training "
                 "large models practical. Variants such as momentum and Adam adapt the step size to speed up "
                 "convergence and avoid getting stuck.",
         links=["ml", "nn", "linear-algebra", "backprop", "learning-rate"]),
    dict(id="backprop", title="Backpropagation Step by Step", url="https://example.edu/wiki/backpropagation",
         description="How error signals flow backward through a network to update every weight.",
         content="Backpropagation applies the chain rule from calculus to compute the gradient of the loss with "
                 "respect to every weight in a network, working backward from the output layer to the input layer. "
                 "Each layer only needs the gradient passed to it from the layer after it and its own local "
                 "derivative, which makes the computation efficient even for very deep networks.",
         links=["nn", "gradient-descent", "linear-algebra", "dl"]),
    dict(id="numpy", title="NumPy Handbook", url="https://example.edu/wiki/numpy",
         description="Fast array computation in Python, the foundation most data tools are built on.",
         content="NumPy provides the n-dimensional array object that almost every Python data science library is "
                 "built on. Operations are vectorized and implemented in C, so working with arrays of numbers is "
                 "far faster than looping in pure Python. Broadcasting rules let arrays of different shapes combine "
                 "in arithmetic without explicit loops, which keeps numerical code short and fast.",
         links=["python", "linear-algebra", "scikit-learn"]),
    dict(id="scikit-learn", title="Scikit-learn Tutorial", url="https://example.edu/wiki/scikit-learn",
         description="A consistent interface for training and evaluating classical machine learning models.",
         content="Scikit-learn offers a consistent fit-and-predict interface across dozens of classical machine "
                 "learning algorithms, from linear models and decision trees to clustering and dimensionality "
                 "reduction. It also includes tools for splitting data, scaling features, cross-validation and "
                 "measuring accuracy, precision and recall, which makes it a common starting point for applied "
                 "machine learning projects.",
         links=["python", "ml", "numpy", "statistics", "overfitting"]),
    dict(id="graph-theory", title="Graph Theory Basics", url="https://example.edu/wiki/graph-theory",
         description="Nodes and edges as a model for networks, from web pages to social graphs.",
         content="A graph is a set of nodes connected by edges, used to model anything with relationships: web "
                 "pages and hyperlinks, people and friendships, cities and roads. A directed graph gives edges a "
                 "direction, which matters for hyperlinks since a link from page A to page B does not imply a link "
                 "back. Key properties of a graph include degree, connectivity and the presence of cycles.",
         links=["pagerank", "linear-algebra", "search-engines"]),
    dict(id="pagerank", title="The PageRank Algorithm", url="https://example.edu/wiki/pagerank",
         description="How Google's original ranking algorithm scores pages by the links pointing at them.",
         content="PageRank scores each page in a hyperlink graph by treating a link as a vote of importance, "
                 "weighted by the importance of the page casting the vote. A page's score is the sum of the scores "
                 "of pages linking to it, each divided by how many outgoing links that page has, plus a damping "
                 "term that models a reader occasionally jumping to a random page instead of following a link. The "
                 "scores are computed iteratively until they stop changing significantly.",
         links=["graph-theory", "search-engines", "ranking", "linear-algebra"]),
    dict(id="search-engines", title="Search Engine Design", url="https://example.edu/wiki/search-engines",
         description="The pipeline that turns a typed query into a ranked list of results.",
         content="A search engine combines an index of documents, a way to measure how relevant each document is "
                 "to a query, and a way to rank documents by overall importance. Crawling discovers pages, indexing "
                 "makes them searchable by keyword, and ranking combines text relevance with signals like "
                 "PageRank to decide the order results are shown in. Modern engines add many more signals, but "
                 "these three pieces are the core of the pipeline.",
         links=["pagerank", "ranking", "tfidf", "graph-theory"]),
    dict(id="ranking", title="Ranking and Relevance Scoring", url="https://example.edu/wiki/ranking",
         description="Why search results combine several scores instead of relying on just one.",
         content="Ranking search results well usually means combining several scores: how closely the text matches "
                 "the query, how authoritative the page is, and sometimes freshness or user engagement. A common "
                 "approach is a weighted sum of a normalized relevance score and a normalized authority score such "
                 "as PageRank, tuned so that a page with only one strong signal can still surface when it clearly "
                 "answers the query.",
         links=["pagerank", "tfidf", "search-engines"]),
    dict(id="tfidf", title="TF-IDF and Cosine Similarity", url="https://example.edu/wiki/tfidf",
         description="A classic way to score how relevant a document's text is to a search query.",
         content="TF-IDF scores a word in a document higher when it appears often in that document but rarely "
                 "across the whole collection, which highlights words that are distinctive rather than common. "
                 "Representing a query and a document as TF-IDF vectors and measuring the cosine of the angle "
                 "between them gives a simple, explainable relevance score that does not require training a "
                 "machine learning model.",
         links=["ranking", "search-engines", "statistics"]),
    dict(id="linear-algebra", title="Linear Algebra Primer", url="https://example.edu/wiki/linear-algebra",
         description="Vectors, matrices and the operations that machine learning code runs constantly.",
         content="Linear algebra studies vectors, matrices and the linear transformations between them. Machine "
                 "learning leans on it constantly: a dataset is a matrix, a neural network layer is a matrix "
                 "multiplication followed by a nonlinearity, and PageRank can be expressed as finding the dominant "
                 "eigenvector of a matrix built from the link graph. Matrix multiplication, eigenvalues and "
                 "eigenvectors are the concepts that come up most often.",
         links=["numpy", "pagerank", "statistics"]),
    dict(id="statistics", title="Introduction to Statistics", url="https://example.edu/wiki/statistics",
         description="Probability, distributions and inference, the toolkit behind most data analysis.",
         content="Statistics gives the tools to summarize data and reason about uncertainty: mean and variance "
                 "describe a distribution, probability describes how likely different outcomes are, and inference "
                 "lets you draw conclusions about a population from a sample. Machine learning borrows heavily from "
                 "statistics, from the loss functions used to train models to the tests used to compare them.",
         links=["linear-algebra", "tfidf", "overfitting"]),
    dict(id="overfitting", title="Overfitting and Regularization", url="https://example.edu/wiki/overfitting",
         description="Why a model that fits training data perfectly can still fail on new data.",
         content="Overfitting happens when a model learns the noise in its training data rather than the "
                 "underlying pattern, so it performs well on data it has already seen but poorly on new data. "
                 "Regularization techniques such as L1 and L2 penalties, dropout and early stopping discourage the "
                 "model from fitting the training data too closely, and cross-validation helps detect the problem "
                 "before deploying a model.",
         links=["ml", "scikit-learn", "features", "statistics"]),
    dict(id="features", title="Feature Engineering", url="https://example.edu/wiki/feature-engineering",
         description="Turning raw data into the inputs a model can actually learn from.",
         content="Feature engineering is the process of transforming raw data into inputs that make patterns easier "
                 "for a model to learn, such as scaling numeric values, encoding categories, or combining columns "
                 "into a more informative single feature. Good features often matter more than the choice of "
                 "algorithm, especially for classical machine learning models that do not learn representations "
                 "automatically the way deep networks do.",
         links=["ml", "data-cleaning", "overfitting"]),
    dict(id="data-cleaning", title="Data Cleaning Basics", url="https://example.edu/wiki/data-cleaning",
         description="Handling missing values, duplicates and inconsistent formatting before any modeling starts.",
         content="Real-world data is rarely ready to use: it contains missing values, duplicate records, "
                 "inconsistent formatting and outliers. Data cleaning handles these issues before any modeling "
                 "starts, since even a strong model trained on messy data will produce unreliable results. Common "
                 "steps include imputing or dropping missing values, standardizing formats and detecting outliers.",
         links=["python", "features", "statistics"]),
    dict(id="transformers", title="Transformer Architecture", url="https://example.edu/wiki/transformers",
         description="The attention-based architecture behind most modern language and vision models.",
         content="The transformer architecture processes a sequence using self-attention, which lets every position "
                 "weigh the relevance of every other position directly rather than passing information step by "
                 "step as recurrent networks do. This makes transformers easier to parallelize and very effective "
                 "at capturing long-range relationships in text, and the architecture now underlies most large "
                 "language models.",
         links=["dl", "nn", "activation-functions"]),
    dict(id="cnn", title="Convolutional Neural Networks", url="https://example.edu/wiki/cnn",
         description="Why convolution is a natural fit for recognizing patterns in images.",
         content="Convolutional neural networks apply small filters across an image to detect local patterns such "
                 "as edges and textures, then combine those patterns in deeper layers to recognize larger "
                 "structures like shapes and objects. Sharing the same filter weights across the whole image makes "
                 "the network far more parameter-efficient than a fully connected network would be for the same "
                 "task.",
         links=["dl", "nn"]),
    dict(id="activation-functions", title="Activation Functions", url="https://example.edu/wiki/activation-functions",
         description="Why neural networks need a nonlinearity between layers to learn anything interesting.",
         content="An activation function introduces nonlinearity between the layers of a neural network; without "
                 "one, stacking layers would collapse into a single linear transformation no matter how many "
                 "layers were added. ReLU, sigmoid and tanh are common choices, each with different behavior for "
                 "gradients during training, which affects how easily a deep network learns.",
         links=["nn", "dl", "backprop"]),
    dict(id="learning-rate", title="Choosing a Learning Rate", url="https://example.edu/wiki/learning-rate",
         description="The single hyperparameter that most often decides whether training succeeds.",
         content="The learning rate controls how large a step gradient descent takes at each update. Too high and "
                 "training can diverge or oscillate; too low and training crawls or gets stuck in a poor local "
                 "region. Learning rate schedules that shrink the rate over time, and adaptive optimizers that "
                 "adjust it automatically, are common ways to make training more robust to this choice.",
         links=["gradient-descent", "ml"]),
    dict(id="clustering", title="Clustering Algorithms", url="https://example.edu/wiki/clustering",
         description="Grouping similar data points together without any labeled examples.",
         content="Clustering groups data points so that points in the same group are more similar to each other "
                 "than to points in other groups, without using any labels. K-means assigns points to the nearest "
                 "of k centers and updates the centers repeatedly, while hierarchical clustering builds a tree of "
                 "nested groupings. Clustering is used for customer segmentation, anomaly detection and as a "
                 "preprocessing step for other tasks.",
         links=["ml", "statistics", "scikit-learn"]),
    dict(id="reinforcement-learning", title="Reinforcement Learning Overview", url="https://example.edu/wiki/reinforcement-learning",
         description="Training an agent to make decisions by trial, error and reward.",
         content="Reinforcement learning trains an agent to choose actions in an environment so as to maximize "
                 "cumulative reward over time, learning from the consequences of its own actions rather than from "
                 "a fixed labeled dataset. It has been used to master games, control robots and tune "
                 "recommendation systems, and it introduces its own challenges, such as balancing exploration of "
                 "new actions against exploiting known good ones.",
         links=["ml", "gradient-descent"]),
    dict(id="nlp", title="Natural Language Processing Basics", url="https://example.edu/wiki/nlp",
         description="Teaching machines to work with human language, from tokenizing to translation.",
         content="Natural language processing covers the methods used to let machines work with human language, "
                 "from splitting text into tokens and representing words as vectors, to tasks like translation, "
                 "sentiment analysis and question answering. Early approaches relied on hand-built rules and "
                 "statistics; most modern systems are built on transformer-based language models trained on large "
                 "text collections.",
         links=["transformers", "tfidf", "dl"]),
    dict(id="computer-vision", title="Computer Vision Fundamentals", url="https://example.edu/wiki/computer-vision",
         description="How machines extract meaning from pixels, from edges to object detection.",
         content="Computer vision is the field concerned with extracting meaning from images and video, covering "
                 "tasks such as classification, object detection and segmentation. Classical methods relied on "
                 "hand-crafted features like edges and corners, while modern systems mostly use convolutional or "
                 "transformer-based networks trained end to end on large labeled image datasets.",
         links=["cnn", "dl", "ml"]),
    dict(id="databases", title="Database Fundamentals", url="https://example.edu/wiki/databases",
         description="How structured data is stored, queried and kept consistent at scale.",
         content="A database stores structured data so it can be queried, updated and kept consistent efficiently. "
                 "Relational databases organize data into tables linked by keys and are queried with SQL, while "
                 "NoSQL databases trade some of that structure for flexibility or horizontal scale. Indexing is "
                 "what allows a database to answer queries quickly instead of scanning every row.",
         links=["algorithms", "graph-theory"]),
    dict(id="algorithms", title="Algorithm Complexity", url="https://example.edu/wiki/algorithm-complexity",
         description="Big-O notation and why it matters for choosing between algorithms.",
         content="Algorithm complexity describes how the running time or memory use of an algorithm grows as the "
                 "input size grows, usually expressed in big-O notation. A sorting algorithm that runs in O(n log "
                 "n) time will comfortably outperform one that runs in O(n squared) once the input is large enough, "
                 "even if the slower algorithm is faster on tiny inputs. Understanding complexity helps in choosing "
                 "the right algorithm and data structure for a problem.",
         links=["databases", "graph-theory"]),
]

def main():
    ids = {d["id"] for d in DOCS}
    for d in DOCS:
        d["links"] = [l for l in d["links"] if l in ids and l != d["id"]]
    out_path = os.path.join(os.path.dirname(__file__), "dataset.json")
    with open(out_path, "w") as f:
        json.dump(DOCS, f, indent=2)
    print(f"wrote {len(DOCS)} documents to {out_path}")

if __name__ == "__main__":
    main()
