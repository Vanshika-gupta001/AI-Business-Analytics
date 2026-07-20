def generate_business_report(result):

    health = result.get("health_score", 0)
    status = result.get("status", "")
    
    dataset = result.get("dataset_info", {})

    insights = result.get("insights", [])
    recommendations = result.get("recommendations", [])

    missing_values = 0
    duplicate_found = False

    for item in insights:


        if "missing values" in item:
            try:
                missing_values += int(item.split()[2])
            except:
                pass

        if "duplicate" in item:
            duplicate_found = True


    # Executive Summary

    summary = f"""
## Executive Summary

Dataset quality is {status.lower()} with a score of {health}/100.

The dataset contains {dataset.get('rows')} rows and 
{dataset.get('columns')} columns.

"""


    # Business Insights

    business = """
## Business Insights

The dataset contains clean numerical and categorical features 
suitable for analytics and decision-making.

"""


    # Risk Analysis

    risks = """
## Risks

"""

    if duplicate_found:
        risks += "- Duplicate records may introduce bias in analysis.\n"

    if missing_values > 0:
        risks += "- Missing values can impact model accuracy.\n"

    if not duplicate_found and missing_values == 0:
        risks += "- No major data quality risks detected.\n"



    # Next Steps

    steps = """
## Recommended Next Steps

"""

    if duplicate_found:
        steps += "1. Remove duplicate rows\n"

    if missing_values > 0:
        steps += "2. Impute missing values\n"

    steps += "3. Perform predictive modeling\n"


    report = (
        summary
        + business
        + risks
        + steps
    )

    return report