# Exemple ajouter un nouvel analyzer

## On close l'index 
POST https://vPV6iDOFlosg1i7wV59MFagcGZtvWEUt:TonO1QmF1ZK1L0VRNNu1Y1O9NLOESnHL@bvujrzvlgvfiyxvim7cx-elasticsearch.services.clever-cloud.com/agent/_close

## On ajoute l'analyzer à l'index
PUT https://vPV6iDOFlosg1i7wV59MFagcGZtvWEUt:TonO1QmF1ZK1L0VRNNu1Y1O9NLOESnHL@bvujrzvlgvfiyxvim7cx-elasticsearch.services.clever-cloud.com/agent/_settings
{
  "settings": {
    "analysis": {
      "analyzer": {
        "folding": {
          "tokenizer": "standard",
          "filter":  [ "lowercase", "asciifolding" ]
        }
      }
    }
  }
}

## On open l'index
POST https://vPV6iDOFlosg1i7wV59MFagcGZtvWEUt:TonO1QmF1ZK1L0VRNNu1Y1O9NLOESnHL@bvujrzvlgvfiyxvim7cx-elasticsearch.services.clever-cloud.com/agent/_open

## On ajoute l'analyzer au champs que l'on souhaite (attention on garde bien keywords)
PUT https://vPV6iDOFlosg1i7wV59MFagcGZtvWEUt:TonO1QmF1ZK1L0VRNNu1Y1O9NLOESnHL@bvujrzvlgvfiyxvim7cx-elasticsearch.services.clever-cloud.com/agent/_mappings
{
    "properties": {
        "firstName": {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword",
                    "ignore_above": 256
                },
                "folded": {
                    "type": "text",
                    "analyzer": "folding"
                }
            }
        },
        "lastName": {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword",
                    "ignore_above": 256
                },
                "folded": {
                    "type": "text",
                    "analyzer": "folding"
                }
            }
        },
        "email": {
            "type": "text",
            "fields": {
                "keyword": {
                    "type": "keyword",
                    "ignore_above": 256
                },
                "folded": {
                    "type": "text",
                    "analyzer": "folding"
                }
            }
        }
    }
}

## On update tous les documents de l'index avec le nouveau mapping
POST https://vPV6iDOFlosg1i7wV59MFagcGZtvWEUt:TonO1QmF1ZK1L0VRNNu1Y1O9NLOESnHL@bvujrzvlgvfiyxvim7cx-elasticsearch.services.clever-cloud.com/agent/_update_by_query

## END