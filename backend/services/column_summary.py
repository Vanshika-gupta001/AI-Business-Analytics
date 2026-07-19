def get_column_summary(df):

    summary=[]

    for col in df.columns:

        summary.append({

            "column":col,

            "type":str(df[col].dtype),

            "missing":int(df[col].isnull().sum()),

            "unique":int(df[col].nunique())

        })
    
    return summary