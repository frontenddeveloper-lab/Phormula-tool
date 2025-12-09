import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Define keyword clusters
INTENT_KEYWORDS = {
    "sales": ["sales", "net sales", "revenue", "turnover"],
    "profit": ["profit", "profits", "earnings", "income"],
    "fees": ["fee", "fees", "charges", "commissions"],
    "quantity": ["quantity", "units", "sold units", "volume"],
    "growth": ["growth", "increase", "trend", "progress", "change", "rise"],
    "sku": ["sku", "product", "item", "asin"],
    "comparison": ["compare", "comparison", "vs", "difference", "versus"],
    "chart": ["graph", "chart", "plot", "visualize", "diagram"]
}

def get_normalized_tokens(text):
    if not isinstance(text, str):
        return []  # Return empty list for invalid input
    doc = nlp(text.lower())
    return [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]

def match_concepts(user_input, threshold=0.85):
    if not isinstance(user_input, str):
        return []  # Defensive check

    matched_concepts = set()
    input_tokens = get_normalized_tokens(user_input)

    for concept, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            keyword_doc = nlp(keyword)
            for token in input_tokens:
                token_doc = nlp(token)
                if token_doc.similarity(keyword_doc) >= threshold:
                    matched_concepts.add(concept)
                    break
    return list(matched_concepts)

def contains_concept(user_input, concept):
    return concept in match_concepts(user_input)
